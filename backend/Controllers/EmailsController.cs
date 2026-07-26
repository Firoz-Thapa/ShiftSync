using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmailsController : ControllerBase
{
    private readonly backend.Services.IEmailService _service;

    public EmailsController(backend.Services.IEmailService service)
    {
        _service = service;
    }

    [HttpPost("connect")]
    public async Task<ActionResult<ApiResponse<EmailAccountDto>>> ConnectAccount(EmailConnectRequest request)
    {
        try
        {
            var account = await _service.ConnectAccountAsync(request);
            return Ok(ApiResponse<EmailAccountDto>.Ok(account, "Email account connected"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<EmailAccountDto>.Fail(ex.Message));
        }
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
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailAccountDto>>>> GetAccounts()
    {
        var accounts = await _service.GetAccountsAsync();
        return Ok(ApiResponse<IEnumerable<EmailAccountDto>>.Ok(accounts));
    }

    [HttpDelete("accounts/{accountId}")]
    public async Task<ActionResult<ApiResponse<object>>> DisconnectAccount(string accountId)
    {
        var ok = await _service.DisconnectAccountAsync(accountId);
        if (!ok) return NotFound(ApiResponse<object>.Fail("Email account not found"));
        return Ok(ApiResponse<object>.Ok(null, "Email account disconnected"));
    }

    [HttpGet("{accountId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>>> GetEmails(string accountId, [FromQuery] int limit = 20)
    {
        var messages = await _service.GetEmailsAsync(accountId, limit);
        if (messages is null) return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
        return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(messages));
    }

    [HttpGet("{accountId}/search")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>>> SearchEmails(string accountId, [FromQuery] string? q)
    {
        var results = await _service.SearchEmailsAsync(accountId, q);
        if (results is null) return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
        return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(results));
    }

    [HttpPost("{accountId}/sync")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>>> SyncEmails(string accountId)
    {
        var msgs = await _service.SyncEmailsAsync(accountId);
        if (msgs is null) return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
        return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(msgs, "Emails synced"));
    }

    [HttpGet("{accountId}/{emailId}")]
    public async Task<ActionResult<ApiResponse<EmailMessageDto>>> GetEmail(string accountId, string emailId)
    {
        var email = await _service.GetEmailAsync(accountId, emailId);
        if (email is null) return NotFound(ApiResponse<EmailMessageDto>.Fail("Email not found"));
        return Ok(ApiResponse<EmailMessageDto>.Ok(email));
    }

    [HttpPatch("{accountId}/{emailId}")]
    public async Task<ActionResult<ApiResponse<EmailMessageDto>>> UpdateEmail(string accountId, string emailId, UpdateEmailRequest request)
    {
        var updated = await _service.UpdateEmailAsync(accountId, emailId, request);
        if (updated is null) return NotFound(ApiResponse<EmailMessageDto>.Fail("Email account or email not found"));
        return Ok(ApiResponse<EmailMessageDto>.Ok(updated, "Email updated"));
    }

    // kept for reference; message seeding is handled by the service/repository
}
