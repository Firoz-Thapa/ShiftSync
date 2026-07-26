using backend.Models;

namespace backend.Repositories;

public class InMemoryStudySessionRepository : IStudySessionRepository
{
    private readonly List<StudySessionDto> _sessions = new();
    private int _nextId = 1;
    private readonly object _lock = new();

    private static StudySessionDto Clone(StudySessionDto s) => new()
    {
        Id = s.Id,
        UserId = s.UserId,
        Title = s.Title,
        Subject = s.Subject,
        StartDatetime = s.StartDatetime,
        EndDatetime = s.EndDatetime,
        Location = s.Location,
        SessionType = s.SessionType,
        Priority = s.Priority,
        IsCompleted = s.IsCompleted,
        Notes = s.Notes,
        IsRecurring = s.IsRecurring,
        RecurrencePattern = s.RecurrencePattern,
        RecurrenceEndDate = s.RecurrenceEndDate,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };

    public Task<List<StudySessionDto>> GetAllAsync()
    {
        lock (_lock)
        {
            return Task.FromResult(_sessions.Select(Clone).ToList());
        }
    }

    public Task<StudySessionDto?> GetByIdAsync(int id)
    {
        lock (_lock)
        {
            var found = _sessions.FirstOrDefault(x => x.Id == id);
            return Task.FromResult(found is null ? null : Clone(found));
        }
    }

    public Task<StudySessionDto> CreateAsync(StudySessionDto session)
    {
        lock (_lock)
        {
            session.Id = _nextId++;
            _sessions.Add(Clone(session));
            return Task.FromResult(Clone(session));
        }
    }

    public Task<StudySessionDto?> UpdateAsync(StudySessionDto session)
    {
        lock (_lock)
        {
            var idx = _sessions.FindIndex(x => x.Id == session.Id);
            if (idx == -1) return Task.FromResult<StudySessionDto?>(null);
            _sessions[idx] = Clone(session);
            return Task.FromResult<StudySessionDto?>(Clone(session));
        }
    }

    public Task<bool> DeleteAsync(int id)
    {
        lock (_lock)
        {
            var existing = _sessions.FirstOrDefault(x => x.Id == id);
            if (existing is null) return Task.FromResult(false);
            _sessions.Remove(existing);
            return Task.FromResult(true);
        }
    }
}
