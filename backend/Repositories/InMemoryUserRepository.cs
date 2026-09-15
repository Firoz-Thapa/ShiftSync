using backend.Models;

namespace backend.Repositories;

public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly List<UserRecord> _users = new();
    private readonly object _lock = new();
    private int _nextId = 1;

    private static UserRecord Clone(UserRecord user) => new()
    {
        Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName,
        Role = user.Role, Status = user.Status, AssignedWorkplaceIds = user.AssignedWorkplaceIds.ToList(),
        CreatedAt = user.CreatedAt, UpdatedAt = user.UpdatedAt, PasswordHash = user.PasswordHash
    };

    public Task<List<UserRecord>> GetAllAsync() { lock (_lock) return Task.FromResult(_users.Select(Clone).ToList()); }
    public Task<UserRecord?> GetByIdAsync(int id) { lock (_lock) { var user = _users.SingleOrDefault(x => x.Id == id); return Task.FromResult(user is null ? null : Clone(user)); } }
    public Task<UserRecord?> GetByEmailAsync(string email) { lock (_lock) { var user = _users.SingleOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase)); return Task.FromResult(user is null ? null : Clone(user)); } }
    public Task<UserRecord> CreateAsync(UserRecord user) { lock (_lock) { user.Id = _nextId++; _users.Add(Clone(user)); return Task.FromResult(Clone(user)); } }
    public Task<UserRecord?> UpdateAsync(UserRecord user) { lock (_lock) { var index = _users.FindIndex(x => x.Id == user.Id); if (index < 0) return Task.FromResult<UserRecord?>(null); _users[index] = Clone(user); return Task.FromResult<UserRecord?>(Clone(user)); } }
}
