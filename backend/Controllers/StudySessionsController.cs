using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/study-sessions")]
public class StudySessionsController : ControllerBase
{
    private static readonly List<StudySessionDto> StudySessions = new();

    [HttpGet]
    public ActionResult<ApiResponse<PaginatedResponse<StudySessionDto>>> Get([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? subject, [FromQuery] string? sessionType, [FromQuery] string? priority)
    {
        var query = StudySessions.AsEnumerable();

        if (startDate.HasValue)
        {
            query = query.Where(x => x.StartDatetime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(x => x.StartDatetime < GetExclusiveEndDate(endDate.Value));
        }

        if (!string.IsNullOrEmpty(subject))
        {
            query = query.Where(x => x.Subject == subject);
        }

        if (!string.IsNullOrEmpty(sessionType))
        {
            query = query.Where(x => x.SessionType == sessionType);
        }

        if (!string.IsNullOrEmpty(priority))
        {
            query = query.Where(x => x.Priority == priority);
        }

        var items = query.OrderByDescending(x => x.StartDatetime).ToList();
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
    public ActionResult<ApiResponse<StudySessionDto>> GetById(int id)
    {
        var session = StudySessions.FirstOrDefault(x => x.Id == id);
        if (session is null)
        {
            return NotFound(ApiResponse<StudySessionDto>.Fail("Study session not found"));
        }

        return Ok(ApiResponse<StudySessionDto>.Ok(session));
    }

    [HttpPost]
    public ActionResult<ApiResponse<StudySessionDto>> Create(StudySessionDto session)
    {
        var validationError = ValidateStudySession(session);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<StudySessionDto>.Fail(validationError));
        }

        session.Id = StudySessions.Count == 0 ? 1 : StudySessions.Max(x => x.Id) + 1;
        session.CreatedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;
        StudySessions.Add(session);

        return CreatedAtAction(nameof(GetById), new { id = session.Id }, ApiResponse<StudySessionDto>.Ok(session, "Study session created successfully"));
    }

    [HttpPut("{id:int}")]
    public ActionResult<ApiResponse<StudySessionDto>> Update(int id, StudySessionDto session)
    {
        var existing = StudySessions.FirstOrDefault(x => x.Id == id);
        if (existing is null)
        {
            return NotFound(ApiResponse<StudySessionDto>.Fail("Study session not found"));
        }

        var validationError = ValidateStudySession(session);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<StudySessionDto>.Fail(validationError));
        }

        existing.Title = session.Title;
        existing.Subject = session.Subject;
        existing.StartDatetime = session.StartDatetime;
        existing.EndDatetime = session.EndDatetime;
        existing.Location = session.Location;
        existing.SessionType = session.SessionType;
        existing.Priority = session.Priority;
        existing.IsCompleted = session.IsCompleted;
        existing.Notes = session.Notes;
        existing.IsRecurring = session.IsRecurring;
        existing.RecurrencePattern = session.RecurrencePattern;
        existing.RecurrenceEndDate = session.RecurrenceEndDate;
        existing.UpdatedAt = DateTime.UtcNow;

        return Ok(ApiResponse<StudySessionDto>.Ok(existing, "Study session updated successfully"));
    }

    [HttpDelete("{id:int}")]
    public ActionResult<ApiResponse<object>> Delete(int id)
    {
        var session = StudySessions.FirstOrDefault(x => x.Id == id);
        if (session is null)
        {
            return NotFound(ApiResponse<object>.Fail("Study session not found"));
        }

        StudySessions.Remove(session);
        return Ok(ApiResponse<object>.Ok(null, "Study session deleted successfully"));
    }

    [HttpPut("{id:int}/complete")]
    public ActionResult<ApiResponse<StudySessionDto>> MarkComplete(int id)
    {
        var session = StudySessions.FirstOrDefault(x => x.Id == id);
        if (session is null)
        {
            return NotFound(ApiResponse<StudySessionDto>.Fail("Study session not found"));
        }

        session.IsCompleted = true;
        session.UpdatedAt = DateTime.UtcNow;
        return Ok(ApiResponse<StudySessionDto>.Ok(session, "Study session marked as completed"));
    }

    private static DateTime GetExclusiveEndDate(DateTime endDate) =>
        endDate.TimeOfDay == TimeSpan.Zero ? endDate.Date.AddDays(1) : endDate;

    private static string? ValidateStudySession(StudySessionDto session)
    {
        if (string.IsNullOrWhiteSpace(session.Title))
        {
            return "Study session title is required";
        }

        if (session.EndDatetime <= session.StartDatetime)
        {
            return "Study session end time must be after start time";
        }

        if (session.SessionType is not "lecture" and not "exam" and not "assignment" and not "study_group" and not "lab" and not "other")
        {
            return "Invalid study session type";
        }

        if (session.Priority is not "low" and not "medium" and not "high" and not "urgent")
        {
            return "Invalid study session priority";
        }

        return null;
    }
}
