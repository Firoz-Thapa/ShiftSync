using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class EmailService : IEmailService
{
    private readonly IEmailRepository _repository;

    public EmailService(IEmailRepository repository)
    {
        _repository = repository;
    }

    public async Task<EmailAccountDto> ConnectAccountAsync(EmailConnectRequest request)
    {
        var provider = request.Provider.ToLowerInvariant();
        if (provider is not "gmail" and not "outlook" and not "custom")
            throw new ArgumentException("Unsupported provider");

        if (provider == "custom" && string.IsNullOrWhiteSpace(request.Credentials?.Email))
            throw new ArgumentException("Email is required for custom accounts");

        var email = provider == "custom" ? request.Credentials!.Email : $"{provider}-account@example.com";

        var account = new EmailAccountDto
        {
            Id = Guid.NewGuid().ToString("N"),
            Email = email,
            Provider = provider,
            IsConnected = true,
            LastSync = DateTime.UtcNow
        };

        await _repository.CreateAccountAsync(account);
        // seed messages
        await _repository.SetMessagesAsync(account.Id, CreateSeedMessages(account));
        return account;
    }

    public Task<List<EmailAccountDto>> GetAccountsAsync() => _repository.GetAccountsAsync();

    public Task<bool> DisconnectAccountAsync(string accountId) => _repository.DeleteAccountAsync(accountId);

    public async Task<List<EmailMessageDto>?> GetEmailsAsync(string accountId, int limit)
    {
        var msgs = await _repository.GetMessagesAsync(accountId);
        if (msgs is null) return null;
        var safe = Math.Clamp(limit, 1, 100);
        return msgs.Take(safe).ToList();
    }

    public async Task<List<EmailMessageDto>?> SearchEmailsAsync(string accountId, string? q)
    {
        var msgs = await _repository.GetMessagesAsync(accountId);
        if (msgs is null) return null;
        if (string.IsNullOrWhiteSpace(q)) return msgs;
        var results = msgs.Where(x => x.Subject.Contains(q, StringComparison.OrdinalIgnoreCase) || x.From.Contains(q, StringComparison.OrdinalIgnoreCase) || x.Body.Contains(q, StringComparison.OrdinalIgnoreCase)).ToList();
        return results;
    }

    public async Task<List<EmailMessageDto>?> SyncEmailsAsync(string accountId)
    {
        var account = await _repository.GetAccountByIdAsync(accountId);
        var msgs = await _repository.GetMessagesAsync(accountId);
        if (account is null || msgs is null) return null;
        account.LastSync = DateTime.UtcNow;
        return msgs;
    }

    public Task<EmailMessageDto?> GetEmailAsync(string accountId, string emailId) => _repository.GetMessageAsync(accountId, emailId);

    public async Task<EmailMessageDto?> UpdateEmailAsync(string accountId, string emailId, UpdateEmailRequest request)
    {
        var msgs = await _repository.GetMessagesAsync(accountId);
        if (msgs is null) return null;
        var email = msgs.FirstOrDefault(x => x.Id == emailId);
        if (email is null) return null;
        if (request.IsRead.HasValue) email.IsRead = request.IsRead.Value;
        await _repository.UpdateMessageAsync(accountId, email);
        return email;
    }

    private static List<EmailMessageDto> CreateSeedMessages(EmailAccountDto account) =>
        new()
        {
            new EmailMessageDto
            {
                Id = Guid.NewGuid().ToString("N"),
                From = "schedule@example.com",
                Subject = "Welcome to ShiftSync email",
                Body = $"Connected {account.Email}. Real provider sync is pending OAuth token storage.",
                Date = DateTime.UtcNow,
                IsRead = false,
                HasAttachments = false
            }
        };
}
