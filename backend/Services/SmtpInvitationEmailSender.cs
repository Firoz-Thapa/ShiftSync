using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace backend.Services;

public sealed class SmtpInvitationEmailSender : IInvitationEmailSender
{
    private readonly IConfiguration _configuration;

    public SmtpInvitationEmailSender(IConfiguration configuration) => _configuration = configuration;

    public async Task SendInvitationAsync(string email, string recipientName, string invitationUrl)
    {
        var settings = _configuration.GetSection("InvitationEmail:Smtp");
        var host = settings["Host"];
        var fromAddress = settings["FromAddress"];
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromAddress))
            throw new InvalidOperationException("Invitation SMTP host and sender address must be configured.");

        var port = settings.GetValue("Port", 587);
        var userName = settings["UserName"];
        var password = settings["Password"];
        if (string.IsNullOrWhiteSpace(userName) != string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("Both invitation SMTP username and password must be configured together.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(settings["FromName"] ?? "ShiftSync", fromAddress));
        message.To.Add(new MailboxAddress(recipientName, email));
        message.Subject = "You are invited to ShiftSync";
        message.Body = new BodyBuilder
        {
            TextBody = $"Hello {recipientName},\n\nYou have been invited to join ShiftSync. Accept your invitation within 48 hours:\n{invitationUrl}\n",
            HtmlBody = $"<p>Hello {System.Net.WebUtility.HtmlEncode(recipientName)},</p><p>You have been invited to join ShiftSync. Accept your invitation within 48 hours:</p><p><a href=\"{System.Net.WebUtility.HtmlEncode(invitationUrl)}\">Accept invitation</a></p>"
        }.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            var socketOptions = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
            await client.ConnectAsync(host, port, socketOptions);
            if (!string.IsNullOrWhiteSpace(userName) && !string.IsNullOrWhiteSpace(password))
                await client.AuthenticateAsync(userName, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            throw new InvalidOperationException("Invitation email could not be sent. Check the SMTP configuration and try again.", ex);
        }
    }
}
