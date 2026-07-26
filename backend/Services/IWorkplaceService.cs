using backend.Models;

namespace backend.Services;

public interface IWorkplaceService
{
    Task<List<WorkplaceDto>> GetAllAsync();
    Task<WorkplaceDto?> GetByIdAsync(int id);
    Task<WorkplaceDto> CreateAsync(WorkplaceDto workplace);
    Task<WorkplaceDto?> UpdateAsync(int id, WorkplaceDto workplace);
    Task<bool> DeleteAsync(int id);
}
