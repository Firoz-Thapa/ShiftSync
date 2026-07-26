using backend.Models;

namespace backend.Services;

public interface IEmailService
{
    Task<EmailAccountDto> ConnectAccountAsync(EmailConnectRequest request);
    Task<List<EmailAccountDto>> GetAccountsAsync();
    Task<bool> DisconnectAccountAsync(string accountId);
    Task<List<EmailMessageDto>?> GetEmailsAsync(string accountId, int limit);
    Task<List<EmailMessageDto>?> SearchEmailsAsync(string accountId, string? q);
    Task<List<EmailMessageDto>?> SyncEmailsAsync(string accountId);
    Task<EmailMessageDto?> GetEmailAsync(string accountId, string emailId);
    Task<EmailMessageDto?> UpdateEmailAsync(string accountId, string emailId, UpdateEmailRequest request);
}
