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
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt,
        PasswordHash = user.PasswordHash,
        InvitationTokenHash = user.InvitationTokenHash,
        InvitationExpiresAt = user.InvitationExpiresAt
    };

    public Task<List<UserRecord>> GetAllAsync() { lock (_lock) return Task.FromResult(_users.Select(Clone).ToList()); }
    public Task<UserRecord?> GetByIdAsync(int id) { lock (_lock) { var user = _users.SingleOrDefault(x => x.Id == id); return Task.FromResult(user is null ? null : Clone(user)); } }
    public Task<UserRecord?> GetByEmailAsync(string email) { lock (_lock) { var user = _users.SingleOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase)); return Task.FromResult(user is null ? null : Clone(user)); } }
    public Task<UserRecord> CreateSelfRegisteredAsync(UserRecord user)
    {
        lock (_lock)
        {
            if (_users.Any(x => x.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("An account with this email already exists.");
            user.Role = UserRoles.Agent;
            user.Id = _nextId++;
            _users.Add(Clone(user));
            return Task.FromResult(Clone(user));
        }
    }

    public Task<UserRecord?> CreateBootstrapAdminAsync(UserRecord user)
    {
        lock (_lock)
        {
            if (_users.Count != 0 || _users.Any(x => x.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase)))
                return Task.FromResult<UserRecord?>(null);

            user.Role = UserRoles.Admin;
            user.Id = _nextId++;
            _users.Add(Clone(user));
            return Task.FromResult<UserRecord?>(Clone(user));
        }
    }

    public Task<UserRecord> CreateAsync(UserRecord user) { lock (_lock) { user.Id = _nextId++; _users.Add(Clone(user)); return Task.FromResult(Clone(user)); } }
    public Task<UserRecord?> UpdateAsync(UserRecord user) { lock (_lock) { var index = _users.FindIndex(x => x.Id == user.Id); if (index < 0) return Task.FromResult<UserRecord?>(null); _users[index] = Clone(user); return Task.FromResult<UserRecord?>(Clone(user)); } }

    public Task<UserRecord?> CompleteInvitationAsync(string tokenHash, string passwordHash, DateTime now)
    {
        lock (_lock)
        {
            var user = _users.SingleOrDefault(x =>
                x.Status == UserStatuses.Invited &&
                x.InvitationTokenHash == tokenHash &&
                x.InvitationExpiresAt > now);
            if (user is null) return Task.FromResult<UserRecord?>(null);

            user.Status = UserStatuses.Active;
            user.PasswordHash = passwordHash;
            user.InvitationTokenHash = null;
            user.InvitationExpiresAt = null;
            user.UpdatedAt = now;
            return Task.FromResult<UserRecord?>(Clone(user));
        }
    }

    public Task<UserRecord?> RefreshInvitationAsync(int id, string tokenHash, DateTime expiresAt, DateTime updatedAt)
    {
        lock (_lock)
        {
            var user = _users.SingleOrDefault(x => x.Id == id && x.Status == UserStatuses.Invited);
            if (user is null) return Task.FromResult<UserRecord?>(null);
            user.InvitationTokenHash = tokenHash;
            user.InvitationExpiresAt = expiresAt;
            user.UpdatedAt = updatedAt;
            return Task.FromResult<UserRecord?>(Clone(user));
        }
    }

    public Task DeleteInvitationAsync(int id, string tokenHash)
    {
        lock (_lock)
        {
            _users.RemoveAll(x => x.Id == id && x.Status == UserStatuses.Invited && x.InvitationTokenHash == tokenHash);
            return Task.CompletedTask;
        }
    }
}
