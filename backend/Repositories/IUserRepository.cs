using backend.Models;

namespace backend.Repositories;

public interface IUserRepository
{
    Task<List<UserRecord>> GetAllAsync();
    Task<UserRecord?> GetByIdAsync(int id);
    Task<UserRecord?> GetByEmailAsync(string email);
    Task<UserRecord> CreateSelfRegisteredAsync(UserRecord user);
    Task<UserRecord?> CreateBootstrapAdminAsync(UserRecord user);
    Task<UserRecord> CreateAsync(UserRecord user);
    Task<UserRecord?> UpdateAsync(UserRecord user);
    Task<UserRecord?> CompleteInvitationAsync(string tokenHash, string passwordHash, DateTime now);
    Task<UserRecord?> RefreshInvitationAsync(int id, string tokenHash, DateTime expiresAt, DateTime updatedAt);
    Task DeleteInvitationAsync(int id, string tokenHash);
}
