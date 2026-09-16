using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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

    public UserService(IUserRepository repository, IPasswordHasher<UserRecord> passwordHasher, IConfiguration configuration)
    {
        _repository = repository;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    public async Task<AuthResultDto> RegisterAsync(RegisterRequest request)
    {
        ValidateRegistration(request.Email, request.Password, request.FirstName, request.LastName);
        if (await _repository.GetByEmailAsync(request.Email.Trim()) is not null) throw new ArgumentException("An account with this email already exists.");

        // Until organization onboarding exists, the first account bootstraps the workspace admin.
        var role = (await _repository.GetAllAsync()).Count == 0 ? UserRoles.Admin : UserRoles.Agent;
        var now = DateTime.UtcNow;
        var user = new UserRecord { Email = request.Email.Trim(), FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), Role = role, Status = UserStatuses.Active, CreatedAt = now, UpdatedAt = now };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        return BuildAuthResult(await _repository.CreateAsync(user));
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
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8) throw new ArgumentException("Password must be at least 8 characters.");
        var user = await _repository.GetByEmailAsync(request.Email.Trim()) ?? throw new ArgumentException("Invitation not found.");
        if (user.Status != UserStatuses.Invited) throw new ArgumentException("This invitation has already been used or is unavailable.");
        user.Status = UserStatuses.Active;
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        user.UpdatedAt = DateTime.UtcNow;
        return BuildAuthResult((await _repository.UpdateAsync(user))!);
    }

    public async Task<UserDto?> GetProfileAsync(int id) => (await _repository.GetByIdAsync(id)) is { } user ? ToDto(user) : null;
    public async Task<List<UserDto>> GetAllAsync() => (await _repository.GetAllAsync()).Select(ToDto).ToList();

    public async Task<UserDto> InviteAsync(InviteUserRequest request)
    {
        ValidateUserFields(request.Email, request.FirstName, request.LastName);
        if (request.Role is not (UserRoles.Admin or UserRoles.Agent)) throw new ArgumentException("Role must be admin or agent.");
        if (await _repository.GetByEmailAsync(request.Email.Trim()) is not null) throw new ArgumentException("An account with this email already exists.");
        var now = DateTime.UtcNow;
        var user = new UserRecord { Email = request.Email.Trim(), FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), Role = request.Role, Status = UserStatuses.Invited, AssignedWorkplaceIds = request.AssignedWorkplaceIds.Distinct().ToList(), CreatedAt = now, UpdatedAt = now };
        return ToDto(await _repository.CreateAsync(user));
    }

    public async Task<UserDto?> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await _repository.GetByIdAsync(id);
        if (user is null) return null;
        var admins = await _repository.GetAllAsync();
        var isLastActiveAdmin = user.Role == UserRoles.Admin && user.Status == UserStatuses.Active && admins.Count(x => x.Role == UserRoles.Admin && x.Status == UserStatuses.Active) == 1;
        if (request.Role is not null && request.Role is not (UserRoles.Admin or UserRoles.Agent)) throw new ArgumentException("Role must be admin or agent.");
        if (request.Status is not null && request.Status is not (UserStatuses.Active or UserStatuses.Invited or UserStatuses.Deactivated)) throw new ArgumentException("Invalid user status.");
        if (isLastActiveAdmin && (request.Role == UserRoles.Agent || request.Status == UserStatuses.Deactivated)) throw new ArgumentException("At least one active admin must remain.");
        if (request.Role is not null) user.Role = request.Role;
        if (request.Status is not null) user.Status = request.Status;
        if (request.AssignedWorkplaceIds is not null) user.AssignedWorkplaceIds = request.AssignedWorkplaceIds.Distinct().ToList();
        user.UpdatedAt = DateTime.UtcNow;
        return ToDto((await _repository.UpdateAsync(user))!);
    }

    public async Task<bool> CanAccessWorkplaceAsync(int userId, int workplaceId)
    {
        var user = await _repository.GetByIdAsync(userId);
        return user is not null && user.Status == UserStatuses.Active && (user.Role == UserRoles.Admin || user.AssignedWorkplaceIds.Contains(workplaceId));
    }

    private AuthResultDto BuildAuthResult(UserRecord user) => new() { User = ToDto(user), Token = CreateToken(user) };
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
