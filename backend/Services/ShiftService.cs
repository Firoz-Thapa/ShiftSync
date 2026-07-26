using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class ShiftService : IShiftService
{
    private readonly IShiftRepository _repository;

    public ShiftService(IShiftRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ShiftDto>> GetAllAsync(DateTime? startDate, DateTime? endDate, int? workplaceId)
    {
        var query = (await _repository.GetAllAsync()).AsEnumerable();
        if (startDate.HasValue)
            query = query.Where(x => x.StartDatetime >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(x => x.StartDatetime < GetExclusiveEndDate(endDate.Value));
        if (workplaceId.HasValue)
            query = query.Where(x => x.WorkplaceId == workplaceId.Value);
        return query.OrderByDescending(x => x.StartDatetime).ToList();
    }

    public Task<ShiftDto?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public async Task<ShiftDto> CreateAsync(ShiftDto shift)
    {
        var validation = ValidateShift(shift);
        if (validation is not null) throw new ArgumentException(validation);

        shift.CreatedAt = DateTime.UtcNow;
        shift.UpdatedAt = DateTime.UtcNow;
        shift.ReminderMinutesBefore = shift.ReminderEnabled ? shift.ReminderMinutesBefore : null;
        shift.Workplace = new WorkplaceDto { Id = shift.WorkplaceId, Name = "Placeholder workplace", Color = "#0044AA", PayType = "hourly", HourlyRate = 0m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        return await _repository.CreateAsync(shift);
    }

    public async Task<ShiftDto?> UpdateAsync(int id, ShiftDto shift)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null) return null;

        var validation = ValidateShift(shift);
        if (validation is not null) throw new ArgumentException(validation);

        existing.WorkplaceId = shift.WorkplaceId;
        existing.Title = shift.Title;
        existing.StartDatetime = shift.StartDatetime;
        existing.EndDatetime = shift.EndDatetime;
        existing.BreakDuration = shift.BreakDuration;
        existing.Notes = shift.Notes;
        existing.IsConfirmed = shift.IsConfirmed;
        existing.ReminderEnabled = shift.ReminderEnabled;
        existing.ReminderMinutesBefore = shift.ReminderEnabled ? shift.ReminderMinutesBefore : null;
        existing.ActualStartTime = shift.ActualStartTime;
        existing.ActualEndTime = shift.ActualEndTime;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.Workplace = new WorkplaceDto { Id = shift.WorkplaceId, Name = "Placeholder workplace", Color = "#0044AA", PayType = "hourly", HourlyRate = 0m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        return await _repository.UpdateAsync(existing);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);

    public async Task<ShiftDto?> ConfirmAsync(int id)
    {
        var s = await _repository.GetByIdAsync(id);
        if (s is null) return null;
        s.IsConfirmed = true;
        s.UpdatedAt = DateTime.UtcNow;
        return await _repository.UpdateAsync(s);
    }

    public async Task<ShiftDto?> ClockInAsync(int id)
    {
        var s = await _repository.GetByIdAsync(id);
        if (s is null) return null;
        if (s.ActualStartTime.HasValue && !s.ActualEndTime.HasValue) throw new InvalidOperationException("Shift is already clocked in");
        s.ActualStartTime = DateTime.UtcNow;
        s.ActualEndTime = null;
        s.UpdatedAt = DateTime.UtcNow;
        return await _repository.UpdateAsync(s);
    }

    public async Task<ShiftDto?> ClockOutAsync(int id)
    {
        var s = await _repository.GetByIdAsync(id);
        if (s is null) return null;
        if (!s.ActualStartTime.HasValue) throw new InvalidOperationException("Cannot clock out before clocking in");
        if (s.ActualEndTime.HasValue) throw new InvalidOperationException("Shift is already clocked out");
        s.ActualEndTime = DateTime.UtcNow;
        s.UpdatedAt = DateTime.UtcNow;
        return await _repository.UpdateAsync(s);
    }

    private static DateTime GetExclusiveEndDate(DateTime endDate) =>
        endDate.TimeOfDay == TimeSpan.Zero ? endDate.Date.AddDays(1) : endDate;

    private static string? ValidateShift(ShiftDto shift)
    {
        if (shift.WorkplaceId <= 0) return "Workplace is required";
        if (string.IsNullOrWhiteSpace(shift.Title)) return "Shift title is required";
        if (shift.EndDatetime <= shift.StartDatetime) return "Shift end time must be after start time";
        if (shift.BreakDuration < 0) return "Break duration cannot be negative";
        if (shift.ReminderEnabled && shift.ReminderMinutesBefore is not (15 or 30 or 60)) return "Reminder must be 15, 30, or 60 minutes before the shift";
        return null;
    }
}
