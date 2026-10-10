using backend.Models;

namespace backend.Services;

public interface IEmailService
{
    string CreateAuthorizationUrl(string provider, int userId, string callbackUri);
    Task<EmailAccountDto> CompleteAuthorizationAsync(string provider, string code, string state);
    Task<List<EmailAccountDto>> GetAccountsAsync(int userId);
    Task<bool> DisconnectAccountAsync(string accountId, int userId);
    Task<List<EmailMessageDto>?> GetEmailsAsync(string accountId, int userId, int limit);
    Task<List<EmailMessageDto>?> SearchEmailsAsync(string accountId, int userId, string? q);
    Task<List<EmailMessageDto>?> SyncEmailsAsync(string accountId, int userId);
    Task<EmailMessageDto?> GetEmailAsync(string accountId, string emailId, int userId);
    Task<EmailMessageDto?> UpdateEmailAsync(string accountId, string emailId, int userId, UpdateEmailRequest request);
}
