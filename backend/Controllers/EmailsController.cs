using System.Security.Claims;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/emails")]
public sealed class EmailsController : ControllerBase
{
    private readonly backend.Services.IEmailService _service;
    private readonly IConfiguration _configuration;

    public EmailsController(backend.Services.IEmailService service, IConfiguration configuration)
    {
        _service = service;
        _configuration = configuration;
    }

    [HttpPost("connect/{provider}")]
    public ActionResult<ApiResponse<EmailOAuthStartResponse>> ConnectAccount(string provider)
    {
        try
        {
            var callbackBaseUrl = _configuration["Email:CallbackBaseUrl"];
            if (!Uri.TryCreate(callbackBaseUrl, UriKind.Absolute, out var callbackBaseUri) ||
                (callbackBaseUri.Scheme != Uri.UriSchemeHttp && callbackBaseUri.Scheme != Uri.UriSchemeHttps))
            {
                throw new InvalidOperationException("Set Email__CallbackBaseUrl to the public base URL used for provider callbacks.");
            }

            var callbackUri = new Uri(callbackBaseUri,
                $"api/emails/callback/{Uri.EscapeDataString(provider)}").AbsoluteUri;
            var authorizationUrl = _service.CreateAuthorizationUrl(provider, CurrentUserId, callbackUri);
            return Ok(ApiResponse<EmailOAuthStartResponse>.Ok(
                new EmailOAuthStartResponse { AuthorizationUrl = authorizationUrl }));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<EmailOAuthStartResponse>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<EmailOAuthStartResponse>.Fail(ex.Message));
        }
    }

    [AllowAnonymous]
    [HttpGet("callback/{provider}")]
    public async Task<IActionResult> Callback(
        string provider,
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error)
    {
        if (!string.IsNullOrWhiteSpace(error))
        {
            return RedirectToFrontend($"Email provider authorization failed: {error}");
        }

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
        {
            return RedirectToFrontend("The email provider did not return a valid authorization response.");
        }

        try
        {
            await _service.CompleteAuthorizationAsync(provider, code, state);
            return RedirectToFrontend(null);
        }
        catch (ArgumentException ex)
        {
            return RedirectToFrontend(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return RedirectToFrontend(ex.Message);
        }
        catch (HttpRequestException)
        {
            return RedirectToFrontend("Could not contact the email provider. Please try again.");
        }
    }

    [HttpGet("accounts")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailAccountDto>>>> GetAccounts()
    {
        var accounts = await _service.GetAccountsAsync(CurrentUserId);
        return Ok(ApiResponse<IEnumerable<EmailAccountDto>>.Ok(accounts));
    }

    [HttpDelete("accounts/{accountId}")]
    public async Task<ActionResult<ApiResponse<object>>> DisconnectAccount(string accountId)
    {
        var ok = await _service.DisconnectAccountAsync(accountId, CurrentUserId);
        if (!ok) return NotFound(ApiResponse<object>.Fail("Email account not found"));
        return Ok(ApiResponse<object>.Ok(null, "Email account disconnected"));
    }

    [HttpGet("{accountId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>>> GetEmails(
        string accountId,
        [FromQuery] int limit = 20)
    {
        var messages = await _service.GetEmailsAsync(accountId, CurrentUserId, limit);
        if (messages is null) return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
        return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(messages));
    }

    [HttpGet("{accountId}/search")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>>> SearchEmails(
        string accountId,
        [FromQuery] string? q)
    {
        var results = await _service.SearchEmailsAsync(accountId, CurrentUserId, q);
        if (results is null) return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
        return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(results));
    }

    [HttpPost("{accountId}/sync")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmailMessageDto>>>> SyncEmails(string accountId)
    {
        try
        {
            var messages = await _service.SyncEmailsAsync(accountId, CurrentUserId);
            if (messages is null) return NotFound(ApiResponse<IEnumerable<EmailMessageDto>>.Fail("Email account not found"));
            return Ok(ApiResponse<IEnumerable<EmailMessageDto>>.Ok(messages, "Emails synced"));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway,
                ApiResponse<IEnumerable<EmailMessageDto>>.Fail(ex.Message));
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status502BadGateway,
                ApiResponse<IEnumerable<EmailMessageDto>>.Fail("The email provider could not complete the sync."));
        }
    }

    [HttpGet("{accountId}/{emailId}")]
    public async Task<ActionResult<ApiResponse<EmailMessageDto>>> GetEmail(string accountId, string emailId)
    {
        var email = await _service.GetEmailAsync(accountId, emailId, CurrentUserId);
        if (email is null) return NotFound(ApiResponse<EmailMessageDto>.Fail("Email not found"));
        return Ok(ApiResponse<EmailMessageDto>.Ok(email));
    }

    [HttpPatch("{accountId}/{emailId}")]
    public async Task<ActionResult<ApiResponse<EmailMessageDto>>> UpdateEmail(
        string accountId,
        string emailId,
        UpdateEmailRequest request)
    {
        var updated = await _service.UpdateEmailAsync(accountId, emailId, CurrentUserId, request);
        if (updated is null) return NotFound(ApiResponse<EmailMessageDto>.Fail("Email account or email not found"));
        return Ok(ApiResponse<EmailMessageDto>.Ok(updated, "Email updated"));
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private IActionResult RedirectToFrontend(string? error)
    {
        var frontendUrl = _configuration["Email:FrontendReturnUrl"] ?? "http://localhost:3000/email";
        var separator = frontendUrl.Contains('?') ? '&' : '?';
        var target = string.IsNullOrWhiteSpace(error)
            ? frontendUrl
            : $"{frontendUrl}{separator}emailError={Uri.EscapeDataString(error)}";
        return Redirect(target);
    }
}
