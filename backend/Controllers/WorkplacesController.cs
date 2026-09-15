using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class WorkplacesController : ControllerBase
{
    private readonly backend.Services.IWorkplaceService _service;
    private readonly backend.Services.IUserService _users;

    public WorkplacesController(backend.Services.IWorkplaceService service, backend.Services.IUserService users)
    {
        _service = service;
        _users = users;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<WorkplaceDto>>>> Get()
    {
        var items = await _service.GetAllAsync();
        if (!IsAdmin)
        {
            var accessible = new List<WorkplaceDto>();
            foreach (var workplace in items)
            {
                if (await _users.CanAccessWorkplaceAsync(CurrentUserId, workplace.Id)) accessible.Add(workplace);
            }
            items = accessible;
        }

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
        if (!IsAdmin && !await _users.CanAccessWorkplaceAsync(CurrentUserId, id)) return Forbid();

        return Ok(ApiResponse<WorkplaceDto>.Ok(workplace));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<WorkplaceDto>>> Create(WorkplaceDto workplace)
    {
        try
        {
            if (!IsAdmin) return Forbid();
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
            if (!IsAdmin) return Forbid();
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
        if (!IsAdmin) return Forbid();
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

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin => User.IsInRole(UserRoles.Admin);
}
