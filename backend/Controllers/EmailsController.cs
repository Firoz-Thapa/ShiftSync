using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmailsController : ControllerBase
{
    private static readonly List<EmailAccountDto> Accounts = new();
    private static readonly Dictionary<string, List<EmailMessageDto>> MessagesByAccount = new();

    [HttpPost("connect")]
    public ActionResult<ApiResponse<EmailAccountDto>> ConnectAccount(EmailConnectRequest request)
    {
        var provider = request.Provider.ToLowerInvariant();
        if (provider is not "gmail" and not "outlook" and not "custom")
        {
            return BadRequest(ApiResponse<EmailAccountDto>.Fail("Unsupported provider"));
        }

        if (provider == "custom" && string.IsNullOrWhiteSpace(request.Credentials?.Email))
        {
            return BadRequest(ApiResponse<EmailAccountDto>.Fail("Email is required for custom accounts"));
        }

        var email = provider == "custom"
            ? request.Credentials!.Email
            : $"{provider}-account@example.com";

        var account = new EmailAccountDto
        {
            Id = Guid.NewGuid().ToString("N"),
            Email = email,
            Provider = provider,
            IsConnected = true,
            LastSync = DateTime.UtcNow
        };

        Accounts.Add(account);
        MessagesByAccount[account.Id] = CreateSeedMessages(account);

        return Ok(ApiResponse<EmailAccountDto>.Ok(account, "Email account connected"));
    }

    [HttpGet("connect/{provider}")]
    public ActionResult<ApiResponse<EmailProviderResponse>> Connect(string provider)
    {
        provider = provider.ToLowerInvariant();
        if (provider is not "gmail" and not "outlook")
        {
            return BadRequest(ApiResponse<EmailProviderResponse>.Fail("Unsupported provider"));
        }

        var redirectUrl = provider switch
        {
            "gmail" => "https://accounts.google.com/o/oauth2/v2/auth?...",
            "outlook" => "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...",
            _ => string.Empty
        };

        return Ok(ApiResponse<EmailProviderResponse>.Ok(new EmailProviderResponse
        {
            Provider = provider,
            RedirectUrl = redirectUrl
        }));
    }

    [HttpGet("callback/{provider}")]
    public ActionResult<ApiResponse<object>> Callback(string provider, [FromQuery] string? code, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<object>.Fail($"OAuth error: {error}"));
        }

        if (string.IsNullOrEmpty(code))
        {
            return BadRequest(ApiResponse<object>.Fail("Missing authorization code"));
        }

        return Ok(ApiResponse<object>.Ok(new { provider, code }, "OAuth callback received"));
    }

    [HttpGet("accounts")]
    public ActionResult<ApiResponse<IEnumerable<EmailAccountDto>>> GetAccounts()
    {
        return Ok(ApiResponse<IEnumerable<EmailAccountDto>>.Ok(Accounts));
    }

    [HttpDelete("accounts/{accountId}")]
    public ActionResult<ApiResponse<object>> DisconnectAccount(string accountId)
    {
        var account = Accounts.FirstOrDefault(x => x.Id == accountId);
        if (account is null)
        {
            return NotFound(ApiResponse<object>.Fail("Email account not found"));
        }

        Accounts.Remove(account);
        MessagesByAccount.Remove(accountId);

        return Ok(ApiResponse<object>.Ok(null, "Email account disconnected"));
    }

    [HttpGet("{accountId}")]
    public ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>> GetEmails(string accountId, [FromQuery] int limit = 20)
    {
        if (!TryGetMessages(accountId, out var messages))
        {
            return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
        }

        var safeLimit = Math.Clamp(limit, 1, 100);
        return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(messages.Take(safeLimit)));
    }

    [HttpGet("{accountId}/search")]
    public ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>> SearchEmails(string accountId, [FromQuery] string? q)
    {
        if (!TryGetMessages(accountId, out var messages))
        {
            return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
        }

        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(messages));
        }

        var results = messages.Where(x =>
            x.Subject.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            x.From.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            x.Body.Contains(q, StringComparison.OrdinalIgnoreCase));

        return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(results));
    }

    [HttpPost("{accountId}/sync")]
    public ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>> SyncEmails(string accountId)
    {
        var account = Accounts.FirstOrDefault(x => x.Id == accountId);
        if (account is null || !TryGetMessages(accountId, out var messages))
        {
            return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
        }

        account.LastSync = DateTime.UtcNow;
        return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(messages, "Emails synced"));
    }

    [HttpGet("{accountId}/{emailId}")]
    public ActionResult<ApiResponse<EmailMessageDto>> GetEmail(string accountId, string emailId)
    {
        if (!TryGetMessages(accountId, out var messages))
        {
            return NotFound(ApiResponse<EmailMessageDto>.Fail("Email account not found"));
        }

        var email = messages.FirstOrDefault(x => x.Id == emailId);
        if (email is null)
        {
            return NotFound(ApiResponse<EmailMessageDto>.Fail("Email not found"));
        }

        return Ok(ApiResponse<EmailMessageDto>.Ok(email));
    }

    [HttpPatch("{accountId}/{emailId}")]
    public ActionResult<ApiResponse<EmailMessageDto>> UpdateEmail(string accountId, string emailId, UpdateEmailRequest request)
    {
        if (!TryGetMessages(accountId, out var messages))
        {
            return NotFound(ApiResponse<EmailMessageDto>.Fail("Email account not found"));
        }

        var email = messages.FirstOrDefault(x => x.Id == emailId);
        if (email is null)
        {
            return NotFound(ApiResponse<EmailMessageDto>.Fail("Email not found"));
        }

        if (request.IsRead.HasValue)
        {
            email.IsRead = request.IsRead.Value;
        }

        return Ok(ApiResponse<EmailMessageDto>.Ok(email, "Email updated"));
    }

    private static bool TryGetMessages(string accountId, out List<EmailMessageDto> messages) =>
        MessagesByAccount.TryGetValue(accountId, out messages!);

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
