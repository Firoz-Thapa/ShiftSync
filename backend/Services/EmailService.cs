using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public sealed class EmailService : IEmailService
{
    private readonly IEmailRepository _repository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly EmailOAuthStateStore _stateStore;

    public EmailService(
        IEmailRepository repository,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        EmailOAuthStateStore stateStore)
    {
        _repository = repository;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _stateStore = stateStore;
    }

    public string CreateAuthorizationUrl(string provider, int userId, string callbackUri)
    {
        provider = NormalizeProvider(provider);
        var clientId = RequiredSetting(provider, "ClientId");
        _ = RequiredSetting(provider, "ClientSecret");

        var state = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var verifier = CreateCodeVerifier();
        var challenge = Convert.ToBase64String(SHA256.HashData(Encoding.ASCII.GetBytes(verifier)))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        _stateStore.Add(state, new EmailOAuthState(provider, userId, callbackUri, verifier, DateTime.UtcNow));

        var authorizationEndpoint = provider == "gmail"
            ? "https://accounts.google.com/o/oauth2/v2/auth"
            : "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
        var scopes = provider == "gmail"
            ? "openid email https://www.googleapis.com/auth/gmail.readonly"
            : "openid profile email offline_access User.Read Mail.Read";
        var query = new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["redirect_uri"] = callbackUri,
            ["response_type"] = "code",
            ["scope"] = scopes,
            ["state"] = state,
            ["code_challenge"] = challenge,
            ["code_challenge_method"] = "S256",
            ["prompt"] = provider == "gmail" ? "consent select_account" : "select_account"
        };

        if (provider == "gmail")
        {
            query["access_type"] = "offline";
            query["include_granted_scopes"] = "true";
        }

        var queryString = string.Join("&", query.Select(pair =>
            $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value)}"));
        return $"{authorizationEndpoint}?{queryString}";
    }

    public async Task<EmailAccountDto> CompleteAuthorizationAsync(string provider, string code, string state)
    {
        provider = NormalizeProvider(provider);
        if (string.IsNullOrWhiteSpace(code) || !_stateStore.TryTake(state, out var oauthState) ||
            oauthState.Provider != provider)
        {
            throw new ArgumentException("The email authorization request is invalid or expired.");
        }

        var tokens = await ExchangeCodeAsync(provider, code, oauthState);
        var email = await GetProfileEmailAsync(provider, tokens.AccessToken);
        var account = new EmailAccountDto
        {
            Id = Guid.NewGuid().ToString("N"),
            Email = email,
            Provider = provider,
            IsConnected = true,
            LastSync = null,
            OwnerUserId = oauthState.UserId,
            AccessToken = tokens.AccessToken,
            RefreshToken = tokens.RefreshToken,
            AccessTokenExpiresAt = DateTime.UtcNow.AddSeconds(Math.Max(tokens.ExpiresIn - 60, 0))
        };

        var messages = provider == "gmail"
            ? await GetGmailMessagesAsync(tokens.AccessToken)
            : await GetOutlookMessagesAsync(tokens.AccessToken);
        account.LastSync = DateTime.UtcNow;
        await _repository.CreateAccountAsync(account);
        await _repository.SetMessagesAsync(account.Id, messages);
        return account;
    }

    public Task<List<EmailAccountDto>> GetAccountsAsync(int userId) =>
        _repository.GetAccountsAsync(userId);

    public Task<bool> DisconnectAccountAsync(string accountId, int userId) =>
        _repository.DeleteAccountAsync(accountId, userId);

    public async Task<List<EmailMessageDto>?> GetEmailsAsync(string accountId, int userId, int limit)
    {
        var messages = await _repository.GetMessagesAsync(accountId, userId);
        return messages?.Take(Math.Clamp(limit, 1, 100)).ToList();
    }

    public async Task<List<EmailMessageDto>?> SearchEmailsAsync(string accountId, int userId, string? query)
    {
        var messages = await _repository.GetMessagesAsync(accountId, userId);
        if (messages is null || string.IsNullOrWhiteSpace(query)) return messages;

        return messages.Where(message =>
            message.Subject.Contains(query, StringComparison.OrdinalIgnoreCase) ||
            message.From.Contains(query, StringComparison.OrdinalIgnoreCase) ||
            message.Body.Contains(query, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    public async Task<List<EmailMessageDto>?> SyncEmailsAsync(string accountId, int userId)
    {
        var account = await _repository.GetAccountByIdAsync(accountId, userId);
        if (account is null) return null;

        var accessToken = await GetValidAccessTokenAsync(account);
        var messages = account.Provider == "gmail"
            ? await GetGmailMessagesAsync(accessToken)
            : await GetOutlookMessagesAsync(accessToken);

        await _repository.SetMessagesAsync(accountId, messages);
        account.LastSync = DateTime.UtcNow;
        return messages;
    }

    public Task<EmailMessageDto?> GetEmailAsync(string accountId, string emailId, int userId) =>
        _repository.GetMessageAsync(accountId, emailId, userId);

    public async Task<EmailMessageDto?> UpdateEmailAsync(
        string accountId,
        string emailId,
        int userId,
        UpdateEmailRequest request)
    {
        var email = await _repository.GetMessageAsync(accountId, emailId, userId);
        if (email is null) return null;
        if (request.IsRead.HasValue) email.IsRead = request.IsRead.Value;
        return await _repository.UpdateMessageAsync(accountId, email, userId);
    }

    private async Task<OAuthTokenResponse> ExchangeCodeAsync(
        string provider,
        string code,
        EmailOAuthState oauthState)
    {
        var tokenEndpoint = provider == "gmail"
            ? "https://oauth2.googleapis.com/token"
            : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = RequiredSetting(provider, "ClientId"),
            ["client_secret"] = RequiredSetting(provider, "ClientSecret"),
            ["code"] = code,
            ["code_verifier"] = oauthState.CodeVerifier,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = oauthState.CallbackUri
        });

        using var response = await _httpClientFactory.CreateClient().PostAsync(tokenEndpoint, content);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"The {provider} authorization code could not be exchanged for tokens.");
        }

        return await response.Content.ReadFromJsonAsync<OAuthTokenResponse>()
            ?? throw new InvalidOperationException($"The {provider} token response was empty.");
    }

    private async Task<string> GetProfileEmailAsync(string provider, string accessToken)
    {
        var profileUrl = provider == "gmail"
            ? "https://www.googleapis.com/oauth2/v2/userinfo"
            : "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName";
        using var request = new HttpRequestMessage(HttpMethod.Get, profileUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var response = await _httpClientFactory.CreateClient().SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Could not retrieve the authorized {provider} account profile.");
        }

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var root = document.RootElement;
        var email = provider == "gmail"
            ? ReadString(root, "email")
            : ReadString(root, "mail") ?? ReadString(root, "userPrincipalName");
        return !string.IsNullOrWhiteSpace(email)
            ? email
            : throw new InvalidOperationException($"The authorized {provider} account did not provide an email address.");
    }

    private async Task<string> GetValidAccessTokenAsync(EmailAccountDto account)
    {
        if (!string.IsNullOrWhiteSpace(account.AccessToken) &&
            account.AccessTokenExpiresAt > DateTime.UtcNow)
        {
            return account.AccessToken;
        }

        if (string.IsNullOrWhiteSpace(account.RefreshToken))
        {
            throw new InvalidOperationException("The provider authorization expired. Disconnect the account and connect it again.");
        }

        var provider = NormalizeProvider(account.Provider);
        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = RequiredSetting(provider, "ClientId"),
            ["client_secret"] = RequiredSetting(provider, "ClientSecret"),
            ["refresh_token"] = account.RefreshToken,
            ["grant_type"] = "refresh_token"
        });
        var tokenEndpoint = provider == "gmail"
            ? "https://oauth2.googleapis.com/token"
            : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        using var response = await _httpClientFactory.CreateClient().PostAsync(tokenEndpoint, content);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Could not refresh the {provider} authorization. Disconnect and reconnect the account.");
        }

        var tokens = await response.Content.ReadFromJsonAsync<OAuthTokenResponse>()
            ?? throw new InvalidOperationException($"The {provider} token refresh response was empty.");
        account.AccessToken = tokens.AccessToken;
        account.RefreshToken = tokens.RefreshToken ?? account.RefreshToken;
        account.AccessTokenExpiresAt = DateTime.UtcNow.AddSeconds(Math.Max(tokens.ExpiresIn - 60, 0));
        return account.AccessToken;
    }

    private async Task<List<EmailMessageDto>> GetGmailMessagesAsync(string accessToken)
    {
        using var request = CreateAuthorizedRequest(
            HttpMethod.Get,
            "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20",
            accessToken);
        using var response = await _httpClientFactory.CreateClient().SendAsync(request);
        response.EnsureSuccessStatusCode();
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());

        var messages = new List<EmailMessageDto>();
        if (!document.RootElement.TryGetProperty("messages", out var items)) return messages;

        foreach (var item in items.EnumerateArray())
        {
            var id = ReadString(item, "id");
            if (string.IsNullOrWhiteSpace(id)) continue;

            using var detailRequest = CreateAuthorizedRequest(
                HttpMethod.Get,
                $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{Uri.EscapeDataString(id)}?format=full",
                accessToken);
            using var detailResponse = await _httpClientFactory.CreateClient().SendAsync(detailRequest);
            detailResponse.EnsureSuccessStatusCode();
            using var detail = await JsonDocument.ParseAsync(await detailResponse.Content.ReadAsStreamAsync());
            var root = detail.RootElement;
            var headers = root.GetProperty("payload").GetProperty("headers");
            var from = ReadHeader(headers, "From");
            var subject = ReadHeader(headers, "Subject");
            var date = DateTime.TryParse(ReadHeader(headers, "Date"), out var parsedDate)
                ? parsedDate.ToUniversalTime()
                : DateTime.UtcNow;
            var labels = root.TryGetProperty("labelIds", out var labelIds)
                ? labelIds.EnumerateArray().Select(label => label.GetString()).ToHashSet(StringComparer.Ordinal)
                : new HashSet<string?>(StringComparer.Ordinal);

            messages.Add(new EmailMessageDto
            {
                Id = id,
                From = from ?? string.Empty,
                Subject = subject ?? "(no subject)",
                Body = ReadGmailBody(root.GetProperty("payload")) ?? ReadString(root, "snippet") ?? string.Empty,
                Date = date,
                IsRead = !labels.Contains("UNREAD"),
                HasAttachments = HasGmailAttachment(root.GetProperty("payload"))
            });
        }

        return messages;
    }

    private async Task<List<EmailMessageDto>> GetOutlookMessagesAsync(string accessToken)
    {
        using var request = CreateAuthorizedRequest(
            HttpMethod.Get,
            "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=20&$select=id,from,subject,body,bodyPreview,receivedDateTime,isRead,hasAttachments&$orderby=receivedDateTime%20desc",
            accessToken);
        request.Headers.TryAddWithoutValidation("Prefer", "outlook.body-content-type=\"text\"");
        using var response = await _httpClientFactory.CreateClient().SendAsync(request);
        response.EnsureSuccessStatusCode();
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());

        var messages = new List<EmailMessageDto>();
        if (!document.RootElement.TryGetProperty("value", out var items)) return messages;
        foreach (var item in items.EnumerateArray())
        {
            var from = item.TryGetProperty("from", out var fromObject) &&
                       fromObject.TryGetProperty("emailAddress", out var emailAddress)
                ? ReadString(emailAddress, "address")
                : null;
            var body = item.TryGetProperty("body", out var bodyObject)
                ? ReadString(bodyObject, "content")
                : null;
            messages.Add(new EmailMessageDto
            {
                Id = ReadString(item, "id") ?? string.Empty,
                From = from ?? string.Empty,
                Subject = ReadString(item, "subject") ?? "(no subject)",
                Body = body ?? ReadString(item, "bodyPreview") ?? string.Empty,
                Date = DateTime.TryParse(ReadString(item, "receivedDateTime"), out var date)
                    ? date.ToUniversalTime()
                    : DateTime.UtcNow,
                IsRead = item.TryGetProperty("isRead", out var isRead) && isRead.GetBoolean(),
                HasAttachments = item.TryGetProperty("hasAttachments", out var hasAttachments) && hasAttachments.GetBoolean()
            });
        }

        return messages;
    }

    private string RequiredSetting(string provider, string name) =>
        _configuration[$"Email:{provider}:{name}"] is { Length: > 0 } value
            ? value
            : throw new InvalidOperationException($"Email OAuth is not configured. Set Email__{provider}__{name}.");

    private static string NormalizeProvider(string provider) =>
        provider.ToLowerInvariant() is "gmail" or "outlook" ? provider.ToLowerInvariant()
            : throw new ArgumentException("Unsupported email provider.");

    private static HttpRequestMessage CreateAuthorizedRequest(HttpMethod method, string url, string accessToken)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return request;
    }

    private static string CreateCodeVerifier() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static string? ReadString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static string? ReadHeader(JsonElement headers, string name)
    {
        foreach (var header in headers.EnumerateArray())
        {
            if (string.Equals(ReadString(header, "name"), name, StringComparison.OrdinalIgnoreCase))
            {
                return ReadString(header, "value");
            }
        }

        return null;
    }

    private static string? ReadGmailBody(JsonElement part)
    {
        var mimeType = ReadString(part, "mimeType");
        if (mimeType == "text/plain" &&
            part.TryGetProperty("body", out var body) &&
            ReadString(body, "data") is { } data)
        {
            return DecodeBase64Url(data);
        }

        if (!part.TryGetProperty("parts", out var parts)) return null;

        foreach (var child in parts.EnumerateArray())
        {
            var childBody = ReadGmailBody(child);
            if (ReadString(child, "mimeType") == "text/plain" && childBody is not null) return childBody;
        }

        return null;
    }

    private static bool HasGmailAttachment(JsonElement part)
    {
        if (!string.IsNullOrWhiteSpace(ReadString(part, "filename"))) return true;
        if (part.TryGetProperty("body", out var body) &&
            ReadString(body, "attachmentId") is { Length: > 0 })
        {
            return true;
        }

        return part.TryGetProperty("parts", out var parts) &&
               parts.EnumerateArray().Any(HasGmailAttachment);
    }

    private static string DecodeBase64Url(string value)
    {
        var base64 = value.Replace('-', '+').Replace('_', '/');
        base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');
        return Encoding.UTF8.GetString(Convert.FromBase64String(base64));
    }

    private sealed class OAuthTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
    }
}
