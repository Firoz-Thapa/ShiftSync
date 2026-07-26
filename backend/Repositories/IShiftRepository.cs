using backend.Models;

namespace backend.Repositories;

public interface IShiftRepository
{
    Task<List<ShiftDto>> GetAllAsync();
    Task<ShiftDto?> GetByIdAsync(int id);
    Task<ShiftDto> CreateAsync(ShiftDto shift);
    Task<ShiftDto?> UpdateAsync(ShiftDto shift);
    Task<bool> DeleteAsync(int id);
}
