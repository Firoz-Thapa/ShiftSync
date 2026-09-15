using System.Security.Claims;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IUserService _users;
    public AuthController(IUserService users) => _users = users;

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResultDto>>> Register(RegisterRequest request) => await ExecuteAuth(() => _users.RegisterAsync(request));
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
}
