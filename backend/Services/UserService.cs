using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public sealed class UserService : IUserService
{
    private readonly IUserRepository _repository;
    private readonly IPasswordHasher<UserRecord> _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly IInvitationEmailSender _invitationEmailSender;
    private readonly TimeProvider _timeProvider;

    public UserService(
        IUserRepository repository,
        IPasswordHasher<UserRecord> passwordHasher,
        IConfiguration configuration,
        IInvitationEmailSender invitationEmailSender,
        TimeProvider timeProvider)
    {
        _repository = repository;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _invitationEmailSender = invitationEmailSender;
        _timeProvider = timeProvider;
    }

    public async Task<AuthResultDto> RegisterAsync(RegisterRequest request)
    {
        ValidateRegistration(request.Email, request.Password, request.FirstName, request.LastName);
        if (await _repository.GetByEmailAsync(request.Email.Trim()) is not null) throw new ArgumentException("An account with this email already exists.");

        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var user = new UserRecord { Email = request.Email.Trim(), FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), Role = UserRoles.Agent, Status = UserStatuses.Active, CreatedAt = now, UpdatedAt = now };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        return BuildAuthResult(await _repository.CreateSelfRegisteredAsync(user));
    }

    public async Task<AuthResultDto> LoginAsync(LoginRequest request)
    {
        var user = await _repository.GetByEmailAsync(request.Email.Trim()) ?? throw new UnauthorizedAccessException("Invalid email or password.");
        if (user.Status != UserStatuses.Active) throw new UnauthorizedAccessException("This account is not active.");
        if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed) throw new UnauthorizedAccessException("Invalid email or password.");
        return BuildAuthResult(user);
    }

    public async Task<AuthResultDto> AcceptInvitationAsync(AcceptInvitationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token)) throw new UnauthorizedAccessException("Invitation is invalid or expired.");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8) throw new ArgumentException("Password must be at least 8 characters.");
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var tokenHash = HashInvitationToken(request.Token);
        var passwordHash = _passwordHasher.HashPassword(new UserRecord(), request.Password);
        var user = await _repository.CompleteInvitationAsync(tokenHash, passwordHash, now)
            ?? throw new UnauthorizedAccessException("Invitation is invalid or expired.");
        return BuildAuthResult(user);
    }

    public async Task<UserDto?> GetProfileAsync(int id) => (await _repository.GetByIdAsync(id)) is { } user ? ToDto(user) : null;
    public async Task<List<UserDto>> GetAllAsync() => (await _repository.GetAllAsync()).Select(ToDto).ToList();

    public async Task<UserDto> InviteAsync(InviteUserRequest request)
    {
        ValidateUserFields(request.Email, request.FirstName, request.LastName);
        if (request.Role is not (UserRoles.Admin or UserRoles.Agent)) throw new ArgumentException("Role must be admin or agent.");
        if (await _repository.GetByEmailAsync(request.Email.Trim()) is not null) throw new ArgumentException("An account with this email already exists.");
        var frontendUrl = _configuration["InvitationEmail:FrontendBaseUrl"];
        if (!Uri.TryCreate(frontendUrl, UriKind.Absolute, out var baseUri) || baseUri.Scheme is not ("http" or "https"))
            throw new InvalidOperationException("Invitation frontend base URL must be configured.");

        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var (token, tokenHash) = CreateInvitationToken();
        var expiresAt = now.AddHours(48);
        var user = new UserRecord
        {
            Email = request.Email.Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = request.Role,
            Status = UserStatuses.Invited,
            AssignedWorkplaceIds = request.AssignedWorkplaceIds.Distinct().ToList(),
            CreatedAt = now,
            UpdatedAt = now,
            InvitationTokenHash = tokenHash,
            InvitationExpiresAt = expiresAt
        };
        var created = await _repository.CreateAsync(user);
        try
        {
            await SendInvitationEmailAsync(created, token, baseUri);
        }
        catch
        {
            await _repository.DeleteInvitationAsync(created.Id, tokenHash);
            throw;
        }

        return ToDto(created);
    }

    public async Task<UserDto?> ResendInvitationAsync(int id)
    {
        var user = await _repository.GetByIdAsync(id);
        if (user is null) return null;
        if (user.Status != UserStatuses.Invited) throw new ArgumentException("Only pending invitations can be resent.");

        var frontendUrl = _configuration["InvitationEmail:FrontendBaseUrl"];
        if (!Uri.TryCreate(frontendUrl, UriKind.Absolute, out var baseUri) || baseUri.Scheme is not ("http" or "https"))
            throw new InvalidOperationException("Invitation frontend base URL must be configured.");

        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var (token, tokenHash) = CreateInvitationToken();
        var refreshed = await _repository.RefreshInvitationAsync(id, tokenHash, now.AddHours(48), now);
        if (refreshed is null) throw new ArgumentException("Only pending invitations can be resent.");
        await SendInvitationEmailAsync(refreshed, token, baseUri);
        return ToDto(refreshed);
    }

    public async Task<UserDto?> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await _repository.GetByIdAsync(id);
        if (user is null) return null;
        var admins = await _repository.GetAllAsync();
        var isLastActiveAdmin = user.Role == UserRoles.Admin && user.Status == UserStatuses.Active && admins.Count(x => x.Role == UserRoles.Admin && x.Status == UserStatuses.Active) == 1;
        if (request.Role is not null && request.Role is not (UserRoles.Admin or UserRoles.Agent)) throw new ArgumentException("Role must be admin or agent.");
        if (request.Status is not null && request.Status is not (UserStatuses.Active or UserStatuses.Invited or UserStatuses.Deactivated)) throw new ArgumentException("Invalid user status.");
        if (request.Status == UserStatuses.Invited && user.Status != UserStatuses.Invited) throw new ArgumentException("Invitations must be created through the invitation flow.");
        if (isLastActiveAdmin && (request.Role == UserRoles.Agent || request.Status == UserStatuses.Deactivated)) throw new ArgumentException("At least one active admin must remain.");
        if (request.Role is not null) user.Role = request.Role;
        if (request.Status is not null) user.Status = request.Status;
        if (request.AssignedWorkplaceIds is not null) user.AssignedWorkplaceIds = request.AssignedWorkplaceIds.Distinct().ToList();
        user.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;
        return ToDto((await _repository.UpdateAsync(user))!);
    }

    public async Task<bool> CanAccessWorkplaceAsync(int userId, int workplaceId)
    {
        var user = await _repository.GetByIdAsync(userId);
        return user is not null && user.Status == UserStatuses.Active && (user.Role == UserRoles.Admin || user.AssignedWorkplaceIds.Contains(workplaceId));
    }

    private AuthResultDto BuildAuthResult(UserRecord user) => new() { User = ToDto(user), Token = CreateToken(user) };
    private static string HashInvitationToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    private static (string Token, string Hash) CreateInvitationToken()
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return (token, HashInvitationToken(token));
    }

    private Task SendInvitationEmailAsync(UserRecord user, string token, Uri baseUri)
    {
        var invitationUrl = new Uri(baseUri, $"accept-invitation#token={Uri.EscapeDataString(token)}").ToString();
        return _invitationEmailSender.SendInvitationAsync(user.Email, $"{user.FirstName} {user.LastName}".Trim(), invitationUrl);
    }
    private string CreateToken(UserRecord user)
    {
        var key = _configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new InvalidOperationException("JWT_KEY must be configured.");
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim(ClaimTypes.Email, user.Email), new Claim(ClaimTypes.Role, user.Role), new Claim("status", user.Status) };
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddHours(8), signingCredentials: credentials));
    }
    private static UserDto ToDto(UserRecord user) => new() { Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName, Role = user.Role, Status = user.Status, AssignedWorkplaceIds = user.AssignedWorkplaceIds.ToList(), CreatedAt = user.CreatedAt, UpdatedAt = user.UpdatedAt };
    private static void ValidateRegistration(string email, string password, string firstName, string lastName) { ValidateUserFields(email, firstName, lastName); if (string.IsNullOrWhiteSpace(password) || password.Length < 8) throw new ArgumentException("Password must be at least 8 characters."); }
    private static void ValidateUserFields(string email, string firstName, string lastName) { if (string.IsNullOrWhiteSpace(email) || !email.Contains('@')) throw new ArgumentException("A valid email is required."); if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName)) throw new ArgumentException("First and last name are required."); }
}
