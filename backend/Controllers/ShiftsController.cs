using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private readonly backend.Services.IShiftService _service;
    private readonly backend.Services.IUserService _users;

    public ShiftsController(backend.Services.IShiftService service, backend.Services.IUserService users)
    {
        _service = service;
        _users = users;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<ShiftDto>>>> Get([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? workplaceId)
    {
        var items = await _service.GetAllAsync(startDate, endDate, workplaceId);
        if (!IsAdmin) items = items.Where(shift => shift.UserId == CurrentUserId).ToList();
        var response = new PaginatedResponse<ShiftDto>
        {
            Data = items,
            Pagination = new PaginationMetadata
            {
                CurrentPage = 1,
                TotalPages = 1,
                TotalItems = items.Count,
                ItemsPerPage = items.Count
            }
        };

        return Ok(ApiResponse<PaginatedResponse<ShiftDto>>.Ok(response));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> GetById(int id)
    {
        var shift = await _service.GetByIdAsync(id);
        if (shift is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        if (!CanManage(shift)) return Forbid();
        return Ok(ApiResponse<ShiftDto>.Ok(shift));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> Create(CreateShiftRequest request)
    {
        try
        {
            var assigneeId = IsAdmin && request.UserId.HasValue ? request.UserId.Value : CurrentUserId;
            request.UserId = assigneeId;
            if (await _users.GetProfileAsync(assigneeId) is null) return BadRequest(ApiResponse<ShiftDto>.Fail("Shift assignee not found"));
            if (!IsAdmin && !await _users.CanAccessWorkplaceAsync(CurrentUserId, request.WorkplaceId)) return Forbid();
            var created = await _service.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<ShiftDto>.Ok(created, "Shift created successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> Update(int id, UpdateShiftRequest request)
    {
        try
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
            if (!CanManage(existing)) return Forbid();
            if (!IsAdmin && !await _users.CanAccessWorkplaceAsync(CurrentUserId, request.WorkplaceId)) return Forbid();
            var updated = await _service.UpdateAsync(id, request);
            if (updated is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
            return Ok(ApiResponse<ShiftDto>.Ok(updated, "Shift updated successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing is null) return NotFound(ApiResponse<object>.Fail("Shift not found"));
        if (!CanManage(existing)) return Forbid();
        var removed = await _service.DeleteAsync(id);
        if (!removed) return NotFound(ApiResponse<object>.Fail("Shift not found"));
        return Ok(ApiResponse<object>.Ok(null, "Shift deleted successfully"));
    }

    [HttpPut("{id:int}/confirm")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> Confirm(int id)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        if (!CanManage(existing)) return Forbid();
        var updated = await _service.ConfirmAsync(id);
        if (updated is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        return Ok(ApiResponse<ShiftDto>.Ok(updated, "Shift confirmed"));
    }

    [HttpPut("{id:int}/clock-in")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> ClockIn(int id)
    {
        try
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
            if (!CanManage(existing)) return Forbid();
            var updated = await _service.ClockInAsync(id);
            if (updated is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
            return Ok(ApiResponse<ShiftDto>.Ok(updated, "Shift clocked in"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}/clock-out")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> ClockOut(int id)
    {
        try
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
            if (!CanManage(existing)) return Forbid();
            var updated = await _service.ClockOutAsync(id);
            if (updated is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
            return Ok(ApiResponse<ShiftDto>.Ok(updated, "Shift clocked out"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail(ex.Message));
        }
    }

    private static DateTime GetExclusiveEndDate(DateTime endDate) =>
        endDate.TimeOfDay == TimeSpan.Zero ? endDate.Date.AddDays(1) : endDate;

    private static string? ValidateShift(ShiftDto shift)
    {
        // kept for compatibility; validation happens in service
        if (shift.WorkplaceId <= 0) return "Workplace is required";
        if (string.IsNullOrWhiteSpace(shift.Title)) return "Shift title is required";
        if (shift.EndDatetime <= shift.StartDatetime) return "Shift end time must be after start time";
        if (shift.BreakDuration < 0) return "Break duration cannot be negative";
        if (shift.ReminderEnabled && shift.ReminderMinutesBefore is not (15 or 30 or 60)) return "Reminder must be 15, 30, or 60 minutes before the shift";
        return null;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin => User.IsInRole(UserRoles.Admin);
    private bool CanManage(ShiftDto shift) => IsAdmin || shift.UserId == CurrentUserId;
}
