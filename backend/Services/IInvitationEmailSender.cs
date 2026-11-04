namespace backend.Services;

public interface IInvitationEmailSender
{
    Task SendInvitationAsync(string email, string recipientName, string invitationUrl);
}
