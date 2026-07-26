using backend.Models;

namespace backend.Repositories;

public interface IWorkplaceRepository
{
    Task<List<WorkplaceDto>> GetAllAsync();
    Task<WorkplaceDto?> GetByIdAsync(int id);
    Task<WorkplaceDto> CreateAsync(WorkplaceDto workplace);
    Task<WorkplaceDto?> UpdateAsync(WorkplaceDto workplace);
    Task<bool> DeleteAsync(int id);
}
