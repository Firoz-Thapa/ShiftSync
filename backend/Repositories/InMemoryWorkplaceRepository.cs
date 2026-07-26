using backend.Models;

namespace backend.Repositories;

public class InMemoryWorkplaceRepository : IWorkplaceRepository
{
    private readonly List<WorkplaceDto> _workplaces = new();
    private int _nextId = 1;
    private readonly object _lock = new();

    private static WorkplaceDto Clone(WorkplaceDto w) => new()
    {
        Id = w.Id,
        Name = w.Name,
        Color = w.Color,
        PayType = w.PayType,
        HourlyRate = w.HourlyRate,
        MonthlySalary = w.MonthlySalary,
        Address = w.Address,
        ContactInfo = w.ContactInfo,
        Notes = w.Notes,
        IsRecurring = w.IsRecurring,
        RecurrencePattern = w.RecurrencePattern,
        RecurrenceEndDate = w.RecurrenceEndDate,
        CreatedAt = w.CreatedAt,
        UpdatedAt = w.UpdatedAt
    };

    public Task<List<WorkplaceDto>> GetAllAsync()
    {
        lock (_lock)
        {
            return Task.FromResult(_workplaces.Select(Clone).ToList());
        }
    }

    public Task<WorkplaceDto?> GetByIdAsync(int id)
    {
        lock (_lock)
        {
            var found = _workplaces.FirstOrDefault(x => x.Id == id);
            return Task.FromResult(found is null ? null : Clone(found));
        }
    }

    public Task<WorkplaceDto> CreateAsync(WorkplaceDto workplace)
    {
        lock (_lock)
        {
            workplace.Id = _nextId++;
            _workplaces.Add(Clone(workplace));
            return Task.FromResult(Clone(workplace));
        }
    }

    public Task<WorkplaceDto?> UpdateAsync(WorkplaceDto workplace)
    {
        lock (_lock)
        {
            var idx = _workplaces.FindIndex(x => x.Id == workplace.Id);
            if (idx == -1) return Task.FromResult<WorkplaceDto?>(null);
            _workplaces[idx] = Clone(workplace);
            return Task.FromResult<WorkplaceDto?>(Clone(workplace));
        }
    }

    public Task<bool> DeleteAsync(int id)
    {
        lock (_lock)
        {
            var existing = _workplaces.FirstOrDefault(x => x.Id == id);
            if (existing is null) return Task.FromResult(false);
            _workplaces.Remove(existing);
            return Task.FromResult(true);
        }
    }
}
