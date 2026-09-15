using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class NoticesController : ControllerBase
{
    private readonly backend.Services.INoticeService _service;
    private readonly backend.Services.IUserService _users;

    public NoticesController(backend.Services.INoticeService service, backend.Services.IUserService users)
    {
        _service = service;
        _users = users;
    }

    [HttpGet("workplace/{workplaceId:int}")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<NoticeDto>>>> GetByWorkplace(int workplaceId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!await _users.CanAccessWorkplaceAsync(CurrentUserId, workplaceId)) return Forbid();
        var response = await _service.GetByWorkplaceAsync(workplaceId, page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<NoticeDto>>.Ok(response));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<NoticeDto>>> GetById(int id)
    {
        var notice = await _service.GetByIdAsync(id);
        if (notice is null) return NotFound(ApiResponse<NoticeDto>.Fail("Notice not found"));
        if (!await _users.CanAccessWorkplaceAsync(CurrentUserId, notice.WorkplaceId)) return Forbid();
        return Ok(ApiResponse<NoticeDto>.Ok(notice));
    }

    [HttpPost("workplace/{workplaceId:int}")]
    public async Task<ActionResult<ApiResponse<NoticeDto>>> Create(int workplaceId, [FromBody] CreateNoticeRequest request)
    {
        try
        {
            if (!IsAdmin) return Forbid();
            var created = await _service.CreateAsync(workplaceId, request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<NoticeDto>.Ok(created, "Notice created successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<NoticeDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<NoticeDto>>> Update(int id, [FromBody] UpdateNoticeRequest request)
    {
        if (!IsAdmin) return Forbid();
        var updated = await _service.UpdateAsync(id, request);
        if (updated is null) return NotFound(ApiResponse<NoticeDto>.Fail("Notice not found"));
        return Ok(ApiResponse<NoticeDto>.Ok(updated, "Notice updated successfully"));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        if (!IsAdmin) return Forbid();
        var removed = await _service.DeleteAsync(id);
        if (!removed) return NotFound(ApiResponse<object>.Fail("Notice not found"));
        return Ok(ApiResponse<object>.Ok(null, "Notice deleted successfully"));
    }

    private static string? ValidateCreateRequest(CreateNoticeRequest request)
    {
        // kept for compatibility; validation now lives in the service
        if (string.IsNullOrWhiteSpace(request.Title)) return "Notice title is required";
        if (string.IsNullOrWhiteSpace(request.Content)) return "Notice content is required";
        if (request.Title.Length > 200) return "Notice title cannot exceed 200 characters";
        if (request.Content.Length > 5000) return "Notice content cannot exceed 5000 characters";
        return null;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin => User.IsInRole(UserRoles.Admin);
}
