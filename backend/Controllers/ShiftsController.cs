using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private readonly backend.Services.IShiftService _service;

    public ShiftsController(backend.Services.IShiftService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<ShiftDto>>>> Get([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? workplaceId)
    {
        var items = await _service.GetAllAsync(startDate, endDate, workplaceId);
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
        return Ok(ApiResponse<ShiftDto>.Ok(shift));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> Create(ShiftDto shift)
    {
        try
        {
            var created = await _service.CreateAsync(shift);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<ShiftDto>.Ok(created, "Shift created successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> Update(int id, ShiftDto shift)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, shift);
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
        var removed = await _service.DeleteAsync(id);
        if (!removed) return NotFound(ApiResponse<object>.Fail("Shift not found"));
        return Ok(ApiResponse<object>.Ok(null, "Shift deleted successfully"));
    }

    [HttpPut("{id:int}/confirm")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> Confirm(int id)
    {
        var updated = await _service.ConfirmAsync(id);
        if (updated is null) return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        return Ok(ApiResponse<ShiftDto>.Ok(updated, "Shift confirmed"));
    }

    [HttpPut("{id:int}/clock-in")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> ClockIn(int id)
    {
        try
        {
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
}
