using backend.Models;

namespace backend.Repositories;

public class InMemoryEmailRepository : IEmailRepository
{
    private readonly List<EmailAccountDto> _accounts = new();
    private readonly Dictionary<string, List<EmailMessageDto>> _messagesByAccount = new();
    private readonly object _lock = new();

    public Task<EmailAccountDto> CreateAccountAsync(EmailAccountDto account)
    {
        lock (_lock)
        {
            _accounts.Add(account);
            _messagesByAccount[account.Id] = new List<EmailMessageDto>();
            return Task.FromResult(account);
        }
    }

    public Task<List<EmailAccountDto>> GetAccountsAsync(int userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_accounts.Where(account => account.OwnerUserId == userId).ToList());
        }
    }

    public Task<EmailAccountDto?> GetAccountByIdAsync(string accountId, int userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_accounts.FirstOrDefault(a => a.Id == accountId && a.OwnerUserId == userId));
        }
    }

    public Task<bool> DeleteAccountAsync(string accountId, int userId)
    {
        lock (_lock)
        {
            var a = _accounts.FirstOrDefault(x => x.Id == accountId && x.OwnerUserId == userId);
            if (a is null) return Task.FromResult(false);
            _accounts.Remove(a);
            _messagesByAccount.Remove(accountId);
            return Task.FromResult(true);
        }
    }

    public Task<List<EmailMessageDto>?> GetMessagesAsync(string accountId, int userId)
    {
        lock (_lock)
        {
            if (_accounts.Any(account => account.Id == accountId && account.OwnerUserId == userId) &&
                _messagesByAccount.TryGetValue(accountId, out var msgs))
            {
                return Task.FromResult<List<EmailMessageDto>?>(msgs.ToList());
            }

            return Task.FromResult<List<EmailMessageDto>?>(null);
        }
    }

    public Task SetMessagesAsync(string accountId, List<EmailMessageDto> messages)
    {
        lock (_lock)
        {
            _messagesByAccount[accountId] = messages.ToList();
            return Task.CompletedTask;
        }
    }

    public Task<EmailMessageDto?> GetMessageAsync(string accountId, string messageId, int userId)
    {
        lock (_lock)
        {
            if (!_accounts.Any(account => account.Id == accountId && account.OwnerUserId == userId) ||
                !_messagesByAccount.TryGetValue(accountId, out var msgs)) return Task.FromResult<EmailMessageDto?>(null);
            return Task.FromResult(msgs.FirstOrDefault(m => m.Id == messageId));
        }
    }

    public Task<EmailMessageDto?> UpdateMessageAsync(string accountId, EmailMessageDto message, int userId)
    {
        lock (_lock)
        {
            if (!_accounts.Any(account => account.Id == accountId && account.OwnerUserId == userId) ||
                !_messagesByAccount.TryGetValue(accountId, out var msgs)) return Task.FromResult<EmailMessageDto?>(null);
            var idx = msgs.FindIndex(m => m.Id == message.Id);
            if (idx == -1) return Task.FromResult<EmailMessageDto?>(null);
            msgs[idx] = message;
            return Task.FromResult<EmailMessageDto?>(message);
        }
    }
}
