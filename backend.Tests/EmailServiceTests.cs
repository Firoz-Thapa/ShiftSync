using backend.Models;
using backend.Repositories;
using backend.Services;

namespace backend.Tests;

public class EmailServiceTests
{
    [Fact]
    public async Task ConnectAccountAsync_RejectsUnsupportedProvider()
    {
        var service = new EmailService(new InMemoryEmailRepository());

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.ConnectAccountAsync(new EmailConnectRequest { Provider = "yahoo" }));

        Assert.Equal("Unsupported provider", exception.Message);
    }

    [Fact]
    public async Task ConnectAccountAsync_CustomAccountCreatesSeedEmail()
    {
        var service = new EmailService(new InMemoryEmailRepository());

        var account = await service.ConnectAccountAsync(new EmailConnectRequest
        {
            Provider = "CUSTOM",
            Credentials = new EmailCredentials { Email = "student@example.com" }
        });
        var emails = await service.GetEmailsAsync(account.Id, 10);

        Assert.Equal("custom", account.Provider);
        Assert.Equal("student@example.com", account.Email);
        var email = Assert.Single(emails!);
        Assert.Contains("student@example.com", email.Body);
        Assert.False(email.IsRead);
    }

    [Fact]
    public async Task SearchAndUpdateEmailAsync_FindsMessageAndMarksItRead()
    {
        var service = new EmailService(new InMemoryEmailRepository());
        var account = await service.ConnectAccountAsync(new EmailConnectRequest { Provider = "gmail" });
        var seededEmail = Assert.Single((await service.GetEmailsAsync(account.Id, 1))!);

        var found = await service.SearchEmailsAsync(account.Id, "welcome");
        var updated = await service.UpdateEmailAsync(account.Id, seededEmail.Id, new UpdateEmailRequest { IsRead = true });

        Assert.Single(found!);
        Assert.NotNull(updated);
        Assert.True(updated.IsRead);
        Assert.True((await service.GetEmailAsync(account.Id, seededEmail.Id))!.IsRead);
    }

    [Fact]
    public async Task GetEmailsAsync_ReturnsNullForUnknownAccount()
    {
        var service = new EmailService(new InMemoryEmailRepository());

        var emails = await service.GetEmailsAsync("missing", 10);

        Assert.Null(emails);
    }
}
