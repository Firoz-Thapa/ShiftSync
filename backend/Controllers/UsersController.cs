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
    public async Task<ActionResult<ApiResponse<UserDto>>> Invite(InviteUserRequest request) { try { return Ok(ApiResponse<UserDto>.Ok(await _users.InviteAsync(request), "Invitation created")); } catch (ArgumentException ex) { return BadRequest(ApiResponse<UserDto>.Fail(ex.Message)); } }
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Update(int id, UpdateUserRequest request) { try { var user = await _users.UpdateAsync(id, request); return user is null ? NotFound(ApiResponse<UserDto>.Fail("User not found")) : Ok(ApiResponse<UserDto>.Ok(user)); } catch (ArgumentException ex) { return BadRequest(ApiResponse<UserDto>.Fail(ex.Message)); } }
}
