using backend.Models;

namespace backend.Repositories;

public interface IEmailRepository
{
    Task<EmailAccountDto> CreateAccountAsync(EmailAccountDto account);
    Task<List<EmailAccountDto>> GetAccountsAsync();
    Task<EmailAccountDto?> GetAccountByIdAsync(string accountId);
    Task<bool> DeleteAccountAsync(string accountId);

    Task<List<EmailMessageDto>?> GetMessagesAsync(string accountId);
    Task SetMessagesAsync(string accountId, List<EmailMessageDto> messages);
    Task<EmailMessageDto?> GetMessageAsync(string accountId, string messageId);
    Task<EmailMessageDto?> UpdateMessageAsync(string accountId, EmailMessageDto message);
}
