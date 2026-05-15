using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<object>> Get()
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            status = "healthy",
            message = "ShiftSync ASP.NET backend is running!",
            timestamp = DateTime.UtcNow,
            version = "1.0.0"
        }));
    }
}
