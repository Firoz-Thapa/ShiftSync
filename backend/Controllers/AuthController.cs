using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IUserService _users;
    private readonly IConfiguration _configuration;
    private readonly bool _selfRegistrationEnabled;

    public AuthController(IUserService users, IConfiguration configuration, IWebHostEnvironment environment)
    {
        _users = users;
        _configuration = configuration;
        _selfRegistrationEnabled = configuration.GetValue<bool?>("SelfRegistration:Enabled") ?? environment.IsDevelopment();
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResultDto>>> Register(RegisterRequest request)
    {
        if (!_selfRegistrationEnabled)
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AuthResultDto>.Fail("Public registration is disabled."));
        return await ExecuteAuth(() => _users.RegisterAsync(request));
    }

    [HttpPost("bootstrap-admin")]
    public async Task<ActionResult<ApiResponse<AuthResultDto>>> BootstrapAdmin(BootstrapAdminRequest request)
    {
        var configuredToken = _configuration["Bootstrap:AdminToken"];
        if (string.IsNullOrWhiteSpace(configuredToken)) return NotFound();
        if (Encoding.UTF8.GetByteCount(configuredToken) < 32)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<AuthResultDto>.Fail("Bootstrap token configuration must contain at least 32 bytes."));
        if (!TokensMatch(configuredToken, request.SetupToken))
            return Unauthorized(ApiResponse<AuthResultDto>.Fail("Invalid bootstrap token."));

        try
        {
            var result = await _users.BootstrapAdminAsync(new RegisterRequest
            {
                Email = request.Email,
                Password = request.Password,
                FirstName = request.FirstName,
                LastName = request.LastName
            });
            return result is null
                ? Conflict(ApiResponse<AuthResultDto>.Fail("Bootstrap is only available before the first account is created."))
                : Ok(ApiResponse<AuthResultDto>.Ok(result));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<AuthResultDto>.Fail(ex.Message));
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResultDto>>> Login(LoginRequest request) => await ExecuteAuth(() => _users.LoginAsync(request));
    [HttpPost("accept-invitation")]
    public async Task<ActionResult<ApiResponse<AuthResultDto>>> AcceptInvitation(AcceptInvitationRequest request) => await ExecuteAuth(() => _users.AcceptInvitationAsync(request));
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Me()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _users.GetProfileAsync(id);
        return user is null ? Unauthorized(ApiResponse<UserDto>.Fail("User not found")) : Ok(ApiResponse<UserDto>.Ok(user));
    }

    private async Task<ActionResult<ApiResponse<AuthResultDto>>> ExecuteAuth(Func<Task<AuthResultDto>> action)
    {
        try { return Ok(ApiResponse<AuthResultDto>.Ok(await action())); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(ApiResponse<AuthResultDto>.Fail(ex.Message)); }
        catch (ArgumentException ex) { return BadRequest(ApiResponse<AuthResultDto>.Fail(ex.Message)); }
    }

    private static bool TokensMatch(string expected, string supplied)
    {
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        var suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(supplied));
        return CryptographicOperations.FixedTimeEquals(expectedHash, suppliedHash);
    }
}
