using System.Collections.Concurrent;

namespace backend.Services;

public sealed class EmailOAuthStateStore
{
    private readonly ConcurrentDictionary<string, EmailOAuthState> _states = new();

    public void Add(string state, EmailOAuthState value)
    {
        var expiredBefore = DateTime.UtcNow.AddMinutes(-10);
        foreach (var entry in _states)
        {
            if (entry.Value.CreatedAtUtc < expiredBefore)
            {
                _states.TryRemove(entry.Key, out _);
            }
        }

        _states[state] = value;
    }

    public bool TryTake(string state, out EmailOAuthState value)
    {
        if (_states.TryRemove(state, out var stored) &&
            stored.CreatedAtUtc >= DateTime.UtcNow.AddMinutes(-10))
        {
            value = stored;
            return true;
        }

        value = default!;
        return false;
    }
}

public sealed record EmailOAuthState(
    string Provider,
    int UserId,
    string CallbackUri,
    string CodeVerifier,
    DateTime CreatedAtUtc);
