using backend.Models;

namespace backend.Repositories;

public interface IEmailRepository
{
    Task<EmailAccountDto> CreateAccountAsync(EmailAccountDto account);
    Task<List<EmailAccountDto>> GetAccountsAsync(int userId);
    Task<EmailAccountDto?> GetAccountByIdAsync(string accountId, int userId);
    Task<bool> DeleteAccountAsync(string accountId, int userId);

    Task<List<EmailMessageDto>?> GetMessagesAsync(string accountId, int userId);
    Task SetMessagesAsync(string accountId, List<EmailMessageDto> messages);
    Task<EmailMessageDto?> GetMessageAsync(string accountId, string messageId, int userId);
    Task<EmailMessageDto?> UpdateMessageAsync(string accountId, EmailMessageDto message, int userId);
}
