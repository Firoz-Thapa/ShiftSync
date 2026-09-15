using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();
// JWT authentication setup (reads key from configuration or environment variable JWT_KEY)
var jwtKey = builder.Configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY");
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (!builder.Environment.IsDevelopment()) throw new InvalidOperationException("JWT_KEY must be configured outside development.");
    jwtKey = "development-only-key-change-before-production-2026";
    builder.Configuration["Jwt:Key"] = jwtKey;
}
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddSingleton<Microsoft.AspNetCore.Identity.IPasswordHasher<backend.Models.UserRecord>, Microsoft.AspNetCore.Identity.PasswordHasher<backend.Models.UserRecord>>();
builder.Services.AddSingleton<backend.Repositories.IUserRepository, backend.Repositories.InMemoryUserRepository>();
builder.Services.AddScoped<backend.Services.IUserService, backend.Services.UserService>();
// Register in-memory repository and service for workplaces
builder.Services.AddSingleton<backend.Repositories.IWorkplaceRepository, backend.Repositories.InMemoryWorkplaceRepository>();
builder.Services.AddScoped<backend.Services.IWorkplaceService, backend.Services.WorkplaceService>();
builder.Services.AddSingleton<backend.Repositories.IShiftRepository, backend.Repositories.InMemoryShiftRepository>();
builder.Services.AddScoped<backend.Services.IShiftService, backend.Services.ShiftService>();
builder.Services.AddSingleton<backend.Repositories.INoticeRepository, backend.Repositories.InMemoryNoticeRepository>();
builder.Services.AddScoped<backend.Services.INoticeService, backend.Services.NoticeService>();
builder.Services.AddSingleton<backend.Repositories.IStudySessionRepository, backend.Repositories.InMemoryStudySessionRepository>();
builder.Services.AddScoped<backend.Services.IStudySessionService, backend.Services.StudySessionService>();
builder.Services.AddSingleton<backend.Repositories.IEmailRepository, backend.Repositories.InMemoryEmailRepository>();
builder.Services.AddScoped<backend.Services.IEmailService, backend.Services.EmailService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("FrontendDev");
app.UseAuthentication();
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var idClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out var userId)) { context.Response.StatusCode = StatusCodes.Status401Unauthorized; return; }
        var users = context.RequestServices.GetRequiredService<backend.Services.IUserService>();
        var user = await users.GetProfileAsync(userId);
        if (user?.Status != backend.Models.UserStatuses.Active) { context.Response.StatusCode = StatusCodes.Status403Forbidden; return; }
    }
    await next();
});
app.UseAuthorization();
app.MapControllers();
app.Run();
