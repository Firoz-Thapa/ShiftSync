using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkplacesController : ControllerBase
{
    private readonly backend.Services.IWorkplaceService _service;

    public WorkplacesController(backend.Services.IWorkplaceService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<WorkplaceDto>>>> Get()
    {
        var items = await _service.GetAllAsync();

        var response = new PaginatedResponse<WorkplaceDto>
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

        return Ok(ApiResponse<PaginatedResponse<WorkplaceDto>>.Ok(response));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<WorkplaceDto>>> GetById(int id)
    {
        var workplace = await _service.GetByIdAsync(id);
        if (workplace is null)
        {
            return NotFound(ApiResponse<WorkplaceDto>.Fail("Workplace not found"));
        }

        return Ok(ApiResponse<WorkplaceDto>.Ok(workplace));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<WorkplaceDto>>> Create(WorkplaceDto workplace)
    {
        try
        {
            var created = await _service.CreateAsync(workplace);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<WorkplaceDto>.Ok(created, "Workplace created successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<WorkplaceDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<WorkplaceDto>>> Update(int id, WorkplaceDto workplace)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, workplace);
            if (updated is null) return NotFound(ApiResponse<WorkplaceDto>.Fail("Workplace not found"));
            return Ok(ApiResponse<WorkplaceDto>.Ok(updated, "Workplace updated successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<WorkplaceDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        if (!removed) return NotFound(ApiResponse<object>.Fail("Workplace not found"));
        return Ok(ApiResponse<object>.Ok(null, "Workplace deleted successfully"));
    }

    private static string? ValidateWorkplace(WorkplaceDto workplace)
    {
        // kept for compatibility; validation is performed in the service
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
