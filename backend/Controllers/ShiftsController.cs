using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private static readonly List<ShiftDto> Shifts = new();

    [HttpGet]
    public ActionResult<ApiResponse<PaginatedResponse<ShiftDto>>> Get([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? workplaceId)
    {
        var query = Shifts.AsEnumerable();
        if (startDate.HasValue)
        {
            query = query.Where(x => x.StartDatetime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(x => x.StartDatetime < GetExclusiveEndDate(endDate.Value));
        }

        if (workplaceId.HasValue)
        {
            query = query.Where(x => x.WorkplaceId == workplaceId.Value);
        }

        var items = query.OrderByDescending(x => x.StartDatetime).ToList();
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
    public ActionResult<ApiResponse<ShiftDto>> GetById(int id)
    {
        var shift = Shifts.FirstOrDefault(x => x.Id == id);
        if (shift is null)
        {
            return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        }

        return Ok(ApiResponse<ShiftDto>.Ok(shift));
    }

    [HttpPost]
    public ActionResult<ApiResponse<ShiftDto>> Create(ShiftDto shift)
    {
        var validationError = ValidateShift(shift);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail(validationError));
        }

        shift.Id = Shifts.Count == 0 ? 1 : Shifts.Max(x => x.Id) + 1;
        shift.CreatedAt = DateTime.UtcNow;
        shift.UpdatedAt = DateTime.UtcNow;
        shift.Workplace = new WorkplaceDto { Id = shift.WorkplaceId, Name = "Placeholder workplace", Color = "#0044AA", PayType = "hourly", HourlyRate = 0m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Shifts.Add(shift);

        return CreatedAtAction(nameof(GetById), new { id = shift.Id }, ApiResponse<ShiftDto>.Ok(shift, "Shift created successfully"));
    }

    [HttpPut("{id:int}")]
    public ActionResult<ApiResponse<ShiftDto>> Update(int id, ShiftDto shift)
    {
        var existing = Shifts.FirstOrDefault(x => x.Id == id);
        if (existing is null)
        {
            return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        }

        var validationError = ValidateShift(shift);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail(validationError));
        }

        existing.WorkplaceId = shift.WorkplaceId;
        existing.Title = shift.Title;
        existing.StartDatetime = shift.StartDatetime;
        existing.EndDatetime = shift.EndDatetime;
        existing.BreakDuration = shift.BreakDuration;
        existing.Notes = shift.Notes;
        existing.IsConfirmed = shift.IsConfirmed;
        existing.ActualStartTime = shift.ActualStartTime;
        existing.ActualEndTime = shift.ActualEndTime;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.Workplace = new WorkplaceDto { Id = shift.WorkplaceId, Name = "Placeholder workplace", Color = "#0044AA", PayType = "hourly", HourlyRate = 0m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        return Ok(ApiResponse<ShiftDto>.Ok(existing, "Shift updated successfully"));
    }

    [HttpDelete("{id:int}")]
    public ActionResult<ApiResponse<object>> Delete(int id)
    {
        var shift = Shifts.FirstOrDefault(x => x.Id == id);
        if (shift is null)
        {
            return NotFound(ApiResponse<object>.Fail("Shift not found"));
        }

        Shifts.Remove(shift);
        return Ok(ApiResponse<object>.Ok(null, "Shift deleted successfully"));
    }

    [HttpPut("{id:int}/confirm")]
    public ActionResult<ApiResponse<ShiftDto>> Confirm(int id)
    {
        var shift = Shifts.FirstOrDefault(x => x.Id == id);
        if (shift is null)
        {
            return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        }

        shift.IsConfirmed = true;
        shift.UpdatedAt = DateTime.UtcNow;
        return Ok(ApiResponse<ShiftDto>.Ok(shift, "Shift confirmed"));
    }

    [HttpPut("{id:int}/clock-in")]
    public ActionResult<ApiResponse<ShiftDto>> ClockIn(int id)
    {
        var shift = Shifts.FirstOrDefault(x => x.Id == id);
        if (shift is null)
        {
            return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        }

        if (shift.ActualStartTime.HasValue && !shift.ActualEndTime.HasValue)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail("Shift is already clocked in"));
        }

        shift.ActualStartTime = DateTime.UtcNow;
        shift.ActualEndTime = null;
        shift.UpdatedAt = DateTime.UtcNow;
        return Ok(ApiResponse<ShiftDto>.Ok(shift, "Shift clocked in"));
    }

    [HttpPut("{id:int}/clock-out")]
    public ActionResult<ApiResponse<ShiftDto>> ClockOut(int id)
    {
        var shift = Shifts.FirstOrDefault(x => x.Id == id);
        if (shift is null)
        {
            return NotFound(ApiResponse<ShiftDto>.Fail("Shift not found"));
        }

        if (!shift.ActualStartTime.HasValue)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail("Cannot clock out before clocking in"));
        }

        if (shift.ActualEndTime.HasValue)
        {
            return BadRequest(ApiResponse<ShiftDto>.Fail("Shift is already clocked out"));
        }

        shift.ActualEndTime = DateTime.UtcNow;
        shift.UpdatedAt = DateTime.UtcNow;
        return Ok(ApiResponse<ShiftDto>.Ok(shift, "Shift clocked out"));
    }

    private static DateTime GetExclusiveEndDate(DateTime endDate) =>
        endDate.TimeOfDay == TimeSpan.Zero ? endDate.Date.AddDays(1) : endDate;

    private static string? ValidateShift(ShiftDto shift)
    {
        if (shift.WorkplaceId <= 0)
        {
            return "Workplace is required";
        }

        if (string.IsNullOrWhiteSpace(shift.Title))
        {
            return "Shift title is required";
        }

        if (shift.EndDatetime <= shift.StartDatetime)
        {
            return "Shift end time must be after start time";
        }

        if (shift.BreakDuration < 0)
        {
            return "Break duration cannot be negative";
        }

        return null;
    }
}
