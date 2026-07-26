using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class WorkplaceService : IWorkplaceService
{
    private readonly IWorkplaceRepository _repository;

    public WorkplaceService(IWorkplaceRepository repository)
    {
        _repository = repository;
    }

    public Task<List<WorkplaceDto>> GetAllAsync() => _repository.GetAllAsync();

    public Task<WorkplaceDto?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public async Task<WorkplaceDto> CreateAsync(WorkplaceDto workplace)
    {
        var validation = ValidateWorkplace(workplace);
        if (validation is not null) throw new ArgumentException(validation);

        workplace.CreatedAt = DateTime.UtcNow;
        workplace.UpdatedAt = DateTime.UtcNow;
        return await _repository.CreateAsync(workplace);
    }

    public async Task<WorkplaceDto?> UpdateAsync(int id, WorkplaceDto workplace)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null) return null;

        var validation = ValidateWorkplace(workplace);
        if (validation is not null) throw new ArgumentException(validation);

        existing.Name = workplace.Name;
        existing.Color = workplace.Color;
        existing.PayType = workplace.PayType;
        existing.HourlyRate = workplace.HourlyRate;
        existing.MonthlySalary = workplace.MonthlySalary;
        existing.Address = workplace.Address;
        existing.ContactInfo = workplace.ContactInfo;
        existing.Notes = workplace.Notes;
        existing.IsRecurring = workplace.IsRecurring;
        existing.RecurrencePattern = workplace.RecurrencePattern;
        existing.RecurrenceEndDate = workplace.RecurrenceEndDate;
        existing.UpdatedAt = DateTime.UtcNow;

        return await _repository.UpdateAsync(existing);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);

    private static string? ValidateWorkplace(WorkplaceDto workplace)
    {
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
