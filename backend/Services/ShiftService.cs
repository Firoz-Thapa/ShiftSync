using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class ShiftService : IShiftService
{
    private readonly IShiftRepository _repository;
    private readonly IWorkplaceRepository _workplaceRepository;

    public ShiftService(IShiftRepository repository, IWorkplaceRepository workplaceRepository)
    {
        _repository = repository;
        _workplaceRepository = workplaceRepository;
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

    public async Task<ShiftDto> CreateAsync(CreateShiftRequest request)
    {
        var validation = ValidateShift(request);
        if (validation is not null) throw new ArgumentException(validation);
        var workplace = await GetWorkplaceAsync(request.WorkplaceId);

        var now = DateTime.UtcNow;
        var shift = new ShiftDto
        {
            WorkplaceId = request.WorkplaceId,
            Title = request.Title,
            StartDatetime = request.StartDatetime,
            EndDatetime = request.EndDatetime,
            BreakDuration = request.BreakDuration,
            Notes = request.Notes,
            ReminderEnabled = request.ReminderEnabled,
            ReminderMinutesBefore = request.ReminderEnabled ? request.ReminderMinutesBefore : null,
            CreatedAt = now,
            UpdatedAt = now,
            Workplace = workplace
        };
        return await _repository.CreateAsync(shift);
    }

    public async Task<ShiftDto?> UpdateAsync(int id, UpdateShiftRequest request)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null) return null;

        var validation = ValidateShift(request);
        if (validation is not null) throw new ArgumentException(validation);
        var workplace = await GetWorkplaceAsync(request.WorkplaceId);

        existing.WorkplaceId = request.WorkplaceId;
        existing.Title = request.Title;
        existing.StartDatetime = request.StartDatetime;
        existing.EndDatetime = request.EndDatetime;
        existing.BreakDuration = request.BreakDuration;
        existing.Notes = request.Notes;
        existing.ReminderEnabled = request.ReminderEnabled;
        existing.ReminderMinutesBefore = request.ReminderEnabled ? request.ReminderMinutesBefore : null;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.Workplace = workplace;

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

    private async Task<WorkplaceDto> GetWorkplaceAsync(int workplaceId)
    {
        var workplace = await _workplaceRepository.GetByIdAsync(workplaceId);
        return workplace ?? throw new ArgumentException("Workplace not found");
    }

    private static string? ValidateShift(CreateShiftRequest shift)
    {
        if (shift.WorkplaceId <= 0) return "Workplace is required";
        if (string.IsNullOrWhiteSpace(shift.Title)) return "Shift title is required";
        if (shift.EndDatetime <= shift.StartDatetime) return "Shift end time must be after start time";
        if (shift.BreakDuration < 0) return "Break duration cannot be negative";
        if (shift.ReminderEnabled && shift.ReminderMinutesBefore is not (15 or 30 or 60)) return "Reminder must be 15, 30, or 60 minutes before the shift";
        return null;
    }

    private static string? ValidateShift(UpdateShiftRequest shift)
    {
        if (shift.WorkplaceId <= 0) return "Workplace is required";
        if (string.IsNullOrWhiteSpace(shift.Title)) return "Shift title is required";
        if (shift.EndDatetime <= shift.StartDatetime) return "Shift end time must be after start time";
        if (shift.BreakDuration < 0) return "Break duration cannot be negative";
        if (shift.ReminderEnabled && shift.ReminderMinutesBefore is not (15 or 30 or 60)) return "Reminder must be 15, 30, or 60 minutes before the shift";
        return null;
    }
}
