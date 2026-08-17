using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();
// JWT authentication setup (reads key from configuration or environment variable JWT_KEY)
var jwtKey = builder.Configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY");
if (!string.IsNullOrEmpty(jwtKey))
{
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
}
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
app.UseAuthorization();
app.MapControllers();
app.Run();
