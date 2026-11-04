using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize(Roles = UserRoles.Admin)]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserService _users;
    public UsersController(IUserService users) => _users = users;
    [HttpGet] public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAll() => Ok(ApiResponse<List<UserDto>>.Ok(await _users.GetAllAsync()));
    [HttpPost("invite")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Invite(InviteUserRequest request)
    {
        try { return Ok(ApiResponse<UserDto>.Ok(await _users.InviteAsync(request), "Invitation email sent")); }
        catch (ArgumentException ex) { return BadRequest(ApiResponse<UserDto>.Fail(ex.Message)); }
        catch (InvalidOperationException) { return StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<UserDto>.Fail("Invitation email is unavailable. Check the invitation email configuration and try again.")); }
    }
    [HttpPost("{id:int}/resend-invitation")]
    public async Task<ActionResult<ApiResponse<UserDto>>> ResendInvitation(int id)
    {
        try
        {
            var user = await _users.ResendInvitationAsync(id);
            return user is null
                ? NotFound(ApiResponse<UserDto>.Fail("User not found"))
                : Ok(ApiResponse<UserDto>.Ok(user, "Invitation email sent"));
        }
        catch (ArgumentException ex) { return BadRequest(ApiResponse<UserDto>.Fail(ex.Message)); }
        catch (InvalidOperationException) { return StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<UserDto>.Fail("Invitation email is unavailable. Check the invitation email configuration and try again.")); }
    }
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Update(int id, UpdateUserRequest request) { try { var user = await _users.UpdateAsync(id, request); return user is null ? NotFound(ApiResponse<UserDto>.Fail("User not found")) : Ok(ApiResponse<UserDto>.Ok(user)); } catch (ArgumentException ex) { return BadRequest(ApiResponse<UserDto>.Fail(ex.Message)); } }
}
