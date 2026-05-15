using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmailsController : ControllerBase
{
    [HttpGet("connect/{provider}")]
    public ActionResult<ApiResponse<EmailProviderResponse>> Connect(string provider)
    {
        if (provider != "gmail" && provider != "outlook")
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

        // TODO: Exchange code for tokens and persist them securely.
        return Ok(ApiResponse<object>.Ok(new { provider, code }, "OAuth callback received"));
    }
}
