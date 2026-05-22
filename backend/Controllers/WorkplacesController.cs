using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkplacesController : ControllerBase
{
    private static readonly List<WorkplaceDto> Workplaces = new();

    [HttpGet]
    public ActionResult<ApiResponse<PaginatedResponse<WorkplaceDto>>> Get()
    {
        var response = new PaginatedResponse<WorkplaceDto>
        {
            Data = Workplaces,
            Pagination = new PaginationMetadata
            {
                CurrentPage = 1,
                TotalPages = 1,
                TotalItems = Workplaces.Count,
                ItemsPerPage = Workplaces.Count
            }
        };

        return Ok(ApiResponse<PaginatedResponse<WorkplaceDto>>.Ok(response));
    }

    [HttpGet("{id:int}")]
    public ActionResult<ApiResponse<WorkplaceDto>> GetById(int id)
    {
        var workplace = Workplaces.FirstOrDefault(x => x.Id == id);
        if (workplace is null)
        {
            return NotFound(ApiResponse<WorkplaceDto>.Fail("Workplace not found"));
        }

        return Ok(ApiResponse<WorkplaceDto>.Ok(workplace));
    }

    [HttpPost]
    public ActionResult<ApiResponse<WorkplaceDto>> Create(WorkplaceDto workplace)
    {
        var validationError = ValidateWorkplace(workplace);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<WorkplaceDto>.Fail(validationError));
        }

        workplace.Id = Workplaces.Count == 0 ? 1 : Workplaces.Max(x => x.Id) + 1;
        workplace.CreatedAt = DateTime.UtcNow;
        workplace.UpdatedAt = DateTime.UtcNow;
        Workplaces.Add(workplace);

        return CreatedAtAction(nameof(GetById), new { id = workplace.Id }, ApiResponse<WorkplaceDto>.Ok(workplace, "Workplace created successfully"));
    }

    [HttpPut("{id:int}")]
    public ActionResult<ApiResponse<WorkplaceDto>> Update(int id, WorkplaceDto workplace)
    {
        var existing = Workplaces.FirstOrDefault(x => x.Id == id);
        if (existing is null)
        {
            return NotFound(ApiResponse<WorkplaceDto>.Fail("Workplace not found"));
        }

        var validationError = ValidateWorkplace(workplace);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<WorkplaceDto>.Fail(validationError));
        }

        existing.Name = workplace.Name;
        existing.Color = workplace.Color;
        existing.PayType = workplace.PayType;
        existing.HourlyRate = workplace.HourlyRate;
        existing.MonthlySalary = workplace.MonthlySalary;
        existing.Address = workplace.Address;
        existing.ContactInfo = workplace.ContactInfo;
        existing.Notes = workplace.Notes;
        existing.IsRecurring = workplace.IsRecurring;
        existing.RecurrencePattern = workplace.RecurrencePattern;
        existing.RecurrenceEndDate = workplace.RecurrenceEndDate;
        existing.UpdatedAt = DateTime.UtcNow;

        return Ok(ApiResponse<WorkplaceDto>.Ok(existing, "Workplace updated successfully"));
    }

    [HttpDelete("{id:int}")]
    public ActionResult<ApiResponse<object>> Delete(int id)
    {
        var workplace = Workplaces.FirstOrDefault(x => x.Id == id);
        if (workplace is null)
        {
            return NotFound(ApiResponse<object>.Fail("Workplace not found"));
        }

        Workplaces.Remove(workplace);
        return Ok(ApiResponse<object>.Ok(null, "Workplace deleted successfully"));
    }

    private static string? ValidateWorkplace(WorkplaceDto workplace)
    {
        if (string.IsNullOrWhiteSpace(workplace.Name))
        {
            return "Workplace name is required";
        }

        if (workplace.PayType is not "hourly" and not "monthly")
        {
            return "Pay type must be hourly or monthly";
        }

        if (workplace.PayType == "hourly" && workplace.HourlyRate <= 0)
        {
            return "Hourly rate must be greater than zero";
        }

        if (workplace.PayType == "monthly" && (!workplace.MonthlySalary.HasValue || workplace.MonthlySalary <= 0))
        {
            return "Monthly salary must be greater than zero";
        }

        return null;
    }
}
