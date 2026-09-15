using backend.Models;

namespace backend.Repositories;

public interface IUserRepository
{
    Task<List<UserRecord>> GetAllAsync();
    Task<UserRecord?> GetByIdAsync(int id);
    Task<UserRecord?> GetByEmailAsync(string email);
    Task<UserRecord> CreateAsync(UserRecord user);
    Task<UserRecord?> UpdateAsync(UserRecord user);
}
