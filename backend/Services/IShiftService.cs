using backend.Models;

namespace backend.Services;

public interface IShiftService
{
    Task<List<ShiftDto>> GetAllAsync(DateTime? startDate, DateTime? endDate, int? workplaceId);
    Task<ShiftDto?> GetByIdAsync(int id);
    Task<ShiftDto> CreateAsync(ShiftDto shift);
    Task<ShiftDto?> UpdateAsync(int id, ShiftDto shift);
    Task<bool> DeleteAsync(int id);
    Task<ShiftDto?> ConfirmAsync(int id);
    Task<ShiftDto?> ClockInAsync(int id);
    Task<ShiftDto?> ClockOutAsync(int id);
}
