using System.Net;
using System.Text;
using backend.Models;
using backend.Repositories;
using backend.Services;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;

namespace backend.Tests;

public class EmailServiceTests
{
    [Fact]
    public void CreateAuthorizationUrl_RejectsUnsupportedProvider()
    {
        var service = CreateService(new StubHttpClientFactory(_ => new HttpResponseMessage(HttpStatusCode.OK)), includeSettings: true);

        var exception = Assert.Throws<ArgumentException>(() =>
            service.CreateAuthorizationUrl("yahoo", 7, "https://localhost/callback"));

        Assert.Equal("Unsupported email provider.", exception.Message);
    }

    [Fact]
    public void CreateAuthorizationUrl_ReportsMissingProviderConfiguration()
    {
        var service = CreateService(new StubHttpClientFactory(_ => new HttpResponseMessage(HttpStatusCode.OK)), includeSettings: false);

        var exception = Assert.Throws<InvalidOperationException>(() =>
            service.CreateAuthorizationUrl("gmail", 7, "https://localhost/callback"));

        Assert.Contains("Email__gmail__ClientId", exception.Message);
    }

    [Fact]
    public async Task OAuthFlow_ConnectsAndSyncsGmailInboxOnlyForOwner()
    {
        var handler = new StubHttpClientFactory(request =>
        {
            if (request.RequestUri!.AbsolutePath == "/token")
            {
                return JsonResponse("""{"access_token":"access-token","refresh_token":"refresh-token","expires_in":3600}""");
            }

            if (request.RequestUri.AbsolutePath.EndsWith("/userinfo", StringComparison.Ordinal))
            {
                return JsonResponse("""{"email":"student@example.com"}""");
            }

            if (request.RequestUri.AbsolutePath.EndsWith("/messages", StringComparison.Ordinal))
            {
                Assert.Equal("Bearer", request.Headers.Authorization!.Scheme);
                Assert.Equal("access-token", request.Headers.Authorization.Parameter);
                return JsonResponse("""{"messages":[{"id":"message-1"}]}""");
            }

            if (request.RequestUri.AbsolutePath.EndsWith("/messages/message-1", StringComparison.Ordinal))
            {
                return JsonResponse(
                    """{"payload":{"mimeType":"text/plain","body":{"data":"SGVsbG8gbWVzc2FnZQ"},"headers":[{"name":"From","value":"teacher@example.com"},{"name":"Subject","value":"Class schedule"},{"name":"Date","value":"Thu, 09 Oct 2026 10:00:00 +0000"}]},"snippet":"Updated schedule details","labelIds":["INBOX","UNREAD"]}""");
            }

            throw new InvalidOperationException($"Unexpected provider request: {request.RequestUri}");
        });
        var service = CreateService(handler, includeSettings: true);
        var repository = handler.Repository;

        var authorizationUrl = service.CreateAuthorizationUrl(
            "gmail",
            userId: 7,
            callbackUri: "https://localhost/api/emails/callback/gmail");
        var url = new Uri(authorizationUrl);
        var query = QueryHelpers.ParseQuery(url.Query);
        Assert.Equal("S256", query["code_challenge_method"]);
        Assert.Contains("gmail.readonly", query["scope"].ToString());

        var account = await service.CompleteAuthorizationAsync("gmail", "authorization-code", query["state"]!);
        var serializedAccount = System.Text.Json.JsonSerializer.Serialize(account);
        Assert.Equal("student@example.com", account.Email);
        Assert.DoesNotContain("access-token", serializedAccount);
        Assert.DoesNotContain("refresh-token", serializedAccount);
        Assert.Empty(await service.GetAccountsAsync(8));
        Assert.Single(await service.GetAccountsAsync(7));
        Assert.Null(await service.GetEmailsAsync(account.Id, userId: 8, limit: 20));

        var messages = await service.SyncEmailsAsync(account.Id, userId: 7);
        var message = Assert.Single(messages!);
        Assert.Equal("teacher@example.com", message.From);
        Assert.Equal("Class schedule", message.Subject);
        Assert.Equal("Hello message", message.Body);
        Assert.False(message.IsRead);
        Assert.NotNull(account.LastSync);
        Assert.Null(await service.GetEmailAsync(account.Id, message.Id, userId: 8));
        Assert.False(await service.DisconnectAccountAsync(account.Id, userId: 8));

        var updated = await service.UpdateEmailAsync(
            account.Id, message.Id, userId: 7, new UpdateEmailRequest { IsRead = true });
        Assert.True(updated!.IsRead);
        Assert.True((await service.GetEmailAsync(account.Id, message.Id, userId: 7))!.IsRead);
        Assert.True(await service.DisconnectAccountAsync(account.Id, userId: 7));
        Assert.Empty(await repository.GetAccountsAsync(7));
    }

    [Fact]
    public async Task CompleteAuthorization_RejectsInvalidOrReplayedState()
    {
        var service = CreateService(new StubHttpClientFactory(_ => new HttpResponseMessage(HttpStatusCode.OK)), includeSettings: true);
        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CompleteAuthorizationAsync("gmail", "authorization-code", "invalid-state"));

        Assert.Contains("invalid or expired", exception.Message);
    }

    [Fact]
    public async Task OAuthFlow_ConnectsAndSyncsOutlookInbox()
    {
        var handler = new StubHttpClientFactory(request =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("/token", StringComparison.Ordinal))
            {
                return JsonResponse("""{"access_token":"outlook-access","refresh_token":"outlook-refresh","expires_in":3600}""");
            }

            if (request.RequestUri.AbsolutePath == "/v1.0/me")
            {
                return JsonResponse("""{"mail":"student@outlook.example"}""");
            }

            if (request.RequestUri.AbsolutePath.EndsWith("/mailFolders/inbox/messages", StringComparison.Ordinal))
            {
                Assert.Equal("outlook-access", request.Headers.Authorization!.Parameter);
                return JsonResponse(
                    """{"value":[{"id":"outlook-message-1","from":{"emailAddress":{"address":"manager@example.com"}},"subject":"Shift update","body":{"contentType":"text","content":"Full shift email contents."},"bodyPreview":"The shift starts at 9.","receivedDateTime":"2026-10-09T10:00:00Z","isRead":true,"hasAttachments":true}]}""");
            }

            throw new InvalidOperationException($"Unexpected provider request: {request.RequestUri}");
        });
        var service = CreateService(handler, includeSettings: true);
        var authorizationUrl = service.CreateAuthorizationUrl(
            "outlook", userId: 12, callbackUri: "https://localhost/api/emails/callback/outlook");
        var state = QueryHelpers.ParseQuery(new Uri(authorizationUrl).Query)["state"].ToString();
        Assert.False(string.IsNullOrWhiteSpace(state));

        var account = await service.CompleteAuthorizationAsync("outlook", "authorization-code", state);
        var emails = await service.GetEmailsAsync(account.Id, userId: 12, limit: 20);
        var message = Assert.Single(emails!);

        Assert.Equal("student@outlook.example", account.Email);
        Assert.Equal("manager@example.com", message.From);
        Assert.Equal("Shift update", message.Subject);
        Assert.Equal("Full shift email contents.", message.Body);
        Assert.True(message.IsRead);
        Assert.True(message.HasAttachments);
    }

    [Fact]
    public async Task OutlookAuthorizationUrl_UsesMicrosoftGraphReadScopes()
    {
        var service = CreateService(new StubHttpClientFactory(_ => new HttpResponseMessage(HttpStatusCode.OK)), includeSettings: true);

        var authorizationUrl = service.CreateAuthorizationUrl(
            "outlook", userId: 7, callbackUri: "https://localhost/api/emails/callback/outlook");
        var query = QueryHelpers.ParseQuery(new Uri(authorizationUrl).Query);

        Assert.Equal("code", query["response_type"]);
        Assert.Contains("Mail.Read", query["scope"].ToString());
        Assert.Contains("offline_access", query["scope"].ToString());
    }

    private static EmailService CreateService(StubHttpClientFactory factory, bool includeSettings)
    {
        var settings = includeSettings
            ? new Dictionary<string, string?>
            {
                ["Email:gmail:ClientId"] = "gmail-client-id",
                ["Email:gmail:ClientSecret"] = "gmail-client-secret",
                ["Email:outlook:ClientId"] = "outlook-client-id",
                ["Email:outlook:ClientSecret"] = "outlook-client-secret"
            }
            : new Dictionary<string, string?>();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        factory.Repository = new InMemoryEmailRepository();
        return new EmailService(factory.Repository, factory, configuration, new EmailOAuthStateStore());
    }

    private static HttpResponseMessage JsonResponse(string body) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

    private sealed class StubHttpClientFactory(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
        : IHttpClientFactory
    {
        public InMemoryEmailRepository Repository { get; set; } = new();

        public HttpClient CreateClient(string name) =>
            new(new StubHttpMessageHandler(responseFactory), disposeHandler: true);
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(responseFactory(request));
    }
}
