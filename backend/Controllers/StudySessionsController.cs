using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/study-sessions")]
public class StudySessionsController : ControllerBase
{
    private readonly backend.Services.IStudySessionService _service;

    public StudySessionsController(backend.Services.IStudySessionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<StudySessionDto>>>> Get([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? subject, [FromQuery] string? sessionType, [FromQuery] string? priority)
    {
        var items = await _service.GetAllAsync(startDate, endDate, subject, sessionType, priority);
        var response = new PaginatedResponse<StudySessionDto>
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

        return Ok(ApiResponse<PaginatedResponse<StudySessionDto>>.Ok(response));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<StudySessionDto>>> GetById(int id)
    {
        var session = await _service.GetByIdAsync(id);
        if (session is null) return NotFound(ApiResponse<StudySessionDto>.Fail("Study session not found"));
        return Ok(ApiResponse<StudySessionDto>.Ok(session));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StudySessionDto>>> Create(StudySessionDto session)
    {
        try
        {
            var created = await _service.CreateAsync(session);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<StudySessionDto>.Ok(created, "Study session created successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<StudySessionDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<StudySessionDto>>> Update(int id, StudySessionDto session)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, session);
            if (updated is null) return NotFound(ApiResponse<StudySessionDto>.Fail("Study session not found"));
            return Ok(ApiResponse<StudySessionDto>.Ok(updated, "Study session updated successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<StudySessionDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        if (!removed) return NotFound(ApiResponse<object>.Fail("Study session not found"));
        return Ok(ApiResponse<object>.Ok(null, "Study session deleted successfully"));
    }

    [HttpPut("{id:int}/complete")]
    public async Task<ActionResult<ApiResponse<StudySessionDto>>> MarkComplete(int id)
    {
        var updated = await _service.MarkCompleteAsync(id);
        if (updated is null) return NotFound(ApiResponse<StudySessionDto>.Fail("Study session not found"));
        return Ok(ApiResponse<StudySessionDto>.Ok(updated, "Study session marked as completed"));
    }

    private static DateTime GetExclusiveEndDate(DateTime endDate) =>
        endDate.TimeOfDay == TimeSpan.Zero ? endDate.Date.AddDays(1) : endDate;

    private static string? ValidateStudySession(StudySessionDto session)
    {
        // kept for compatibility; validation now lives in the service
        if (string.IsNullOrWhiteSpace(session.Title)) return "Study session title is required";
        if (session.EndDatetime <= session.StartDatetime) return "Study session end time must be after start time";
        if (session.SessionType is not "lecture" and not "exam" and not "assignment" and not "study_group" and not "lab" and not "other") return "Invalid study session type";
        if (session.Priority is not "low" and not "medium" and not "high" and not "urgent") return "Invalid study session priority";
        return null;
    }
}
