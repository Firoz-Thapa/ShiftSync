using backend.Models;

namespace backend.Repositories;

public class InMemoryShiftRepository : IShiftRepository
{
    private readonly List<ShiftDto> _shifts = new();
    private int _nextId = 1;
    private readonly object _lock = new();

    private static ShiftDto Clone(ShiftDto s) => new()
    {
        Id = s.Id,
        UserId = s.UserId,
        WorkplaceId = s.WorkplaceId,
        Workplace = s.Workplace is null ? null : new WorkplaceDto { Id = s.Workplace.Id, Name = s.Workplace.Name, Color = s.Workplace.Color, PayType = s.Workplace.PayType, HourlyRate = s.Workplace.HourlyRate, MonthlySalary = s.Workplace.MonthlySalary, CreatedAt = s.Workplace.CreatedAt, UpdatedAt = s.Workplace.UpdatedAt },
        Title = s.Title,
        StartDatetime = s.StartDatetime,
        EndDatetime = s.EndDatetime,
        BreakDuration = s.BreakDuration,
        Notes = s.Notes,
        IsConfirmed = s.IsConfirmed,
        ReminderEnabled = s.ReminderEnabled,
        ReminderMinutesBefore = s.ReminderMinutesBefore,
        ActualStartTime = s.ActualStartTime,
        ActualEndTime = s.ActualEndTime,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };

    public Task<List<ShiftDto>> GetAllAsync()
    {
        lock (_lock)
        {
            return Task.FromResult(_shifts.Select(Clone).ToList());
        }
    }

    public Task<ShiftDto?> GetByIdAsync(int id)
    {
        lock (_lock)
        {
            var found = _shifts.FirstOrDefault(x => x.Id == id);
            return Task.FromResult(found is null ? null : Clone(found));
        }
    }

    public Task<ShiftDto> CreateAsync(ShiftDto shift)
    {
        lock (_lock)
        {
            shift.Id = _nextId++;
            _shifts.Add(Clone(shift));
            return Task.FromResult(Clone(shift));
        }
    }

    public Task<ShiftDto?> UpdateAsync(ShiftDto shift)
    {
        lock (_lock)
        {
            var idx = _shifts.FindIndex(x => x.Id == shift.Id);
            if (idx == -1) return Task.FromResult<ShiftDto?>(null);
            _shifts[idx] = Clone(shift);
            return Task.FromResult<ShiftDto?>(Clone(shift));
        }
    }

    public Task<bool> DeleteAsync(int id)
    {
        lock (_lock)
        {
            var existing = _shifts.FirstOrDefault(x => x.Id == id);
            if (existing is null) return Task.FromResult(false);
            _shifts.Remove(existing);
            return Task.FromResult(true);
        }
    }
}
