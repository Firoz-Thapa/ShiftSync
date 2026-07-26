using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class StudySessionService : IStudySessionService
{
    private readonly IStudySessionRepository _repository;

    public StudySessionService(IStudySessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<StudySessionDto>> GetAllAsync(DateTime? startDate, DateTime? endDate, string? subject, string? sessionType, string? priority)
    {
        var query = (await _repository.GetAllAsync()).AsEnumerable();
        if (startDate.HasValue) query = query.Where(x => x.StartDatetime >= startDate.Value);
        if (endDate.HasValue) query = query.Where(x => x.StartDatetime < GetExclusiveEndDate(endDate.Value));
        if (!string.IsNullOrEmpty(subject)) query = query.Where(x => x.Subject == subject);
        if (!string.IsNullOrEmpty(sessionType)) query = query.Where(x => x.SessionType == sessionType);
        if (!string.IsNullOrEmpty(priority)) query = query.Where(x => x.Priority == priority);
        return query.OrderByDescending(x => x.StartDatetime).ToList();
    }

    public Task<StudySessionDto?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public async Task<StudySessionDto> CreateAsync(StudySessionDto session)
    {
        var validation = ValidateStudySession(session);
        if (validation is not null) throw new ArgumentException(validation);
        session.CreatedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;
        return await _repository.CreateAsync(session);
    }

    public async Task<StudySessionDto?> UpdateAsync(int id, StudySessionDto session)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null) return null;
        var validation = ValidateStudySession(session);
        if (validation is not null) throw new ArgumentException(validation);

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

        return await _repository.UpdateAsync(existing);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);

    public async Task<StudySessionDto?> MarkCompleteAsync(int id)
    {
        var s = await _repository.GetByIdAsync(id);
        if (s is null) return null;
        s.IsCompleted = true;
        s.UpdatedAt = DateTime.UtcNow;
        return await _repository.UpdateAsync(s);
    }

    private static DateTime GetExclusiveEndDate(DateTime endDate) =>
        endDate.TimeOfDay == TimeSpan.Zero ? endDate.Date.AddDays(1) : endDate;

    private static string? ValidateStudySession(StudySessionDto session)
    {
        if (string.IsNullOrWhiteSpace(session.Title)) return "Study session title is required";
        if (session.EndDatetime <= session.StartDatetime) return "Study session end time must be after start time";
        if (session.SessionType is not "lecture" and not "exam" and not "assignment" and not "study_group" and not "lab" and not "other") return "Invalid study session type";
        if (session.Priority is not "low" and not "medium" and not "high" and not "urgent") return "Invalid study session priority";
        return null;
    }
}
