using backend.Models;
using backend.Controllers;
using backend.Repositories;
using backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace backend.Tests;

public class UserServiceTests
{
    private sealed class CapturingInvitationEmailSender : IInvitationEmailSender
    {
        public string? InvitationUrl { get; private set; }

        public Task SendInvitationAsync(string email, string recipientName, string invitationUrl)
        {
            InvitationUrl = invitationUrl;
            return Task.CompletedTask;
        }
    }

    private sealed class FailingInvitationEmailSender : IInvitationEmailSender
    {
        public Task SendInvitationAsync(string email, string recipientName, string invitationUrl) =>
            throw new InvalidOperationException("SMTP unavailable.");
    }

    private sealed class TestTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public DateTimeOffset CurrentTime { get; set; } = now;
        public override DateTimeOffset GetUtcNow() => CurrentTime;
    }

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "backend.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = string.Empty;
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private static UserService CreateService(
        IUserRepository? repository = null,
        IInvitationEmailSender? invitationEmailSender = null,
        TimeProvider? timeProvider = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test-key-that-is-long-enough-for-hmac-signing",
                ["InvitationEmail:FrontendBaseUrl"] = "https://shiftsync.example"
            })
            .Build();
        return new UserService(
            repository ?? new InMemoryUserRepository(),
            new PasswordHasher<UserRecord>(),
            config,
            invitationEmailSender ?? new CapturingInvitationEmailSender(),
            timeProvider ?? TimeProvider.System);
    }

    [Fact]
    public async Task RegisterAsync_PublicRegistrationCreatesAgentsOnly()
    {
        var service = CreateService();
        var first = await service.RegisterAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" });
        var second = await service.RegisterAsync(new RegisterRequest { Email = "agent@example.test", Password = "password123", FirstName = "Alex", LastName = "Agent" });

        Assert.Equal(UserRoles.Agent, first.User.Role);
        Assert.Equal(UserStatuses.Active, first.User.Status);
        Assert.Equal(UserRoles.Agent, second.User.Role);
        Assert.NotEmpty(first.Token);
    }

    [Fact]
    public async Task LoginAsync_UserCanLogInAfterRepositoryIsRecreated()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"shiftsync-users-{Guid.NewGuid():N}.db");
        try
        {
            var connectionString = $"Data Source={databasePath};Pooling=False";
            var registrationService = CreateService(new SqliteUserRepository(connectionString));
            await registrationService.RegisterAsync(new RegisterRequest
            {
                Email = "persisted@example.test",
                Password = "password123",
                FirstName = "Persisted",
                LastName = "User"
            });

            var loginService = CreateService(new SqliteUserRepository(connectionString));
            var result = await loginService.LoginAsync(new LoginRequest
            {
                Email = "persisted@example.test",
                Password = "password123"
            });

            Assert.Equal("persisted@example.test", result.User.Email);
            Assert.Equal(UserRoles.Agent, result.User.Role);
        }
        finally
        {
            foreach (var suffix in new[] { "", "-shm", "-wal" })
            {
                var file = databasePath + suffix;
                if (File.Exists(file)) File.Delete(file);
            }
        }
    }

    [Fact]
    public async Task RegisterAsync_ConcurrentRegistrationsNeverCreateAdmins()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"shiftsync-bootstrap-{Guid.NewGuid():N}.db");
        try
        {
            var service = CreateService(new SqliteUserRepository($"Data Source={databasePath};Pooling=False"));
            var registrations = await Task.WhenAll(Enumerable.Range(0, 8).Select(index =>
                service.RegisterAsync(new RegisterRequest
                {
                    Email = $"concurrent-{index}@example.test",
                    Password = "password123",
                    FirstName = "Concurrent",
                    LastName = "User"
                })));

            Assert.All(registrations, result => Assert.Equal(UserRoles.Agent, result.User.Role));
        }
        finally
        {
            foreach (var suffix in new[] { "", "-shm", "-wal" })
            {
                var file = databasePath + suffix;
                if (File.Exists(file)) File.Delete(file);
            }
        }
    }

    [Fact]
    public async Task BootstrapAdminAsync_OnlyOneConcurrentRequestCanCreateInitialAdmin()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"shiftsync-admin-bootstrap-{Guid.NewGuid():N}.db");
        try
        {
            var connectionString = $"Data Source={databasePath};Pooling=False";
            var services = Enumerable.Range(0, 2)
                .Select(_ => CreateService(new SqliteUserRepository(connectionString)))
                .ToArray();

            var results = await Task.WhenAll(services.Select(service => service.BootstrapAdminAsync(new RegisterRequest
            {
                Email = $"bootstrap-{Guid.NewGuid():N}@example.test",
                Password = "password123",
                FirstName = "Bootstrap",
                LastName = "Admin"
            })));

            Assert.Single(results, result => result is not null);
            var storedUsers = await new SqliteUserRepository(connectionString).GetAllAsync();
            Assert.Single(storedUsers);
            Assert.Equal(UserRoles.Admin, storedUsers[0].Role);
        }
        finally
        {
            foreach (var suffix in new[] { "", "-shm", "-wal" })
            {
                var file = databasePath + suffix;
                if (File.Exists(file)) File.Delete(file);
            }
        }
    }

    [Fact]
    public async Task ProductionAuth_DisablesRegistrationAndRequiresOneTimeBootstrapToken()
    {
        const string bootstrapToken = "test-bootstrap-token-with-at-least-32-bytes";
        var repository = new InMemoryUserRepository();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test-key-that-is-long-enough-for-hmac-signing",
                ["Bootstrap:AdminToken"] = bootstrapToken
            })
            .Build();
        var service = new UserService(
            repository,
            new PasswordHasher<UserRecord>(),
            configuration,
            new CapturingInvitationEmailSender(),
            TimeProvider.System);
        var controller = new AuthController(service, configuration, new TestWebHostEnvironment());

        var registration = await controller.Register(new RegisterRequest
        {
            Email = "public@example.test",
            Password = "password123",
            FirstName = "Public",
            LastName = "User"
        });
        Assert.Equal(StatusCodes.Status403Forbidden, Assert.IsType<ObjectResult>(registration.Result).StatusCode);
        Assert.Empty(await repository.GetAllAsync());

        var rejectedBootstrap = await controller.BootstrapAdmin(new BootstrapAdminRequest
        {
            SetupToken = "incorrect",
            Email = "admin@example.test",
            Password = "password123",
            FirstName = "Ada",
            LastName = "Admin"
        });
        Assert.Equal(StatusCodes.Status401Unauthorized, Assert.IsType<UnauthorizedObjectResult>(rejectedBootstrap.Result).StatusCode);

        var bootstrap = await controller.BootstrapAdmin(new BootstrapAdminRequest
        {
            SetupToken = bootstrapToken,
            Email = "admin@example.test",
            Password = "password123",
            FirstName = "Ada",
            LastName = "Admin"
        });
        Assert.Equal(StatusCodes.Status200OK, Assert.IsType<OkObjectResult>(bootstrap.Result).StatusCode);

        var repeatedBootstrap = await controller.BootstrapAdmin(new BootstrapAdminRequest
        {
            SetupToken = bootstrapToken,
            Email = "second-admin@example.test",
            Password = "password123",
            FirstName = "Second",
            LastName = "Admin"
        });
        Assert.Equal(StatusCodes.Status409Conflict, Assert.IsType<ConflictObjectResult>(repeatedBootstrap.Result).StatusCode);
        Assert.Single(await repository.GetAllAsync());
        Assert.Equal(UserRoles.Admin, (await repository.GetAllAsync())[0].Role);
    }

    [Fact]
    public async Task UpdateAsync_RejectsDeactivatingFinalActiveAdmin()
    {
        var service = CreateService();
        var admin = await service.BootstrapAdminAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" })
            ?? throw new InvalidOperationException("Test bootstrap admin was not created.");

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(admin.User.Id, new UpdateUserRequest { Status = UserStatuses.Deactivated }));

        Assert.Equal("At least one active admin must remain.", exception.Message);
    }

    [Fact]
    public async Task InviteAndAcceptInvitation_ActivatesAssignedAgent()
    {
        var repository = new InMemoryUserRepository();
        var emailSender = new CapturingInvitationEmailSender();
        var service = CreateService(repository, emailSender);
        await service.BootstrapAdminAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" });
        var invited = await service.InviteAsync(new InviteUserRequest { Email = "agent@example.test", FirstName = "Alex", LastName = "Agent", AssignedWorkplaceIds = [2, 2, 5] });
        var storedUser = await repository.GetByEmailAsync(invited.Email);
        var token = new Uri(emailSender.InvitationUrl!).Fragment["#token=".Length..];
        var result = await service.AcceptInvitationAsync(new AcceptInvitationRequest { Token = token, Password = "password123" });

        Assert.Equal(UserStatuses.Invited, invited.Status);
        Assert.Equal(UserStatuses.Active, result.User.Status);
        Assert.Equal([2, 5], result.User.AssignedWorkplaceIds);
        Assert.NotNull(storedUser?.InvitationTokenHash);
        Assert.NotEqual(token, storedUser?.InvitationTokenHash);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.AcceptInvitationAsync(new AcceptInvitationRequest { Token = token, Password = "password123" }));
    }

    [Fact]
    public async Task ResendInvitationAsync_InvalidatesPreviousToken()
    {
        var repository = new InMemoryUserRepository();
        var emailSender = new CapturingInvitationEmailSender();
        var service = CreateService(repository, emailSender);
        await service.BootstrapAdminAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" });
        var invited = await service.InviteAsync(new InviteUserRequest { Email = "agent@example.test", FirstName = "Alex", LastName = "Agent" });
        var previousToken = new Uri(emailSender.InvitationUrl!).Fragment["#token=".Length..];

        await service.ResendInvitationAsync(invited.Id);
        var resentToken = new Uri(emailSender.InvitationUrl!).Fragment["#token=".Length..];

        Assert.NotEqual(previousToken, resentToken);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.AcceptInvitationAsync(new AcceptInvitationRequest { Token = previousToken, Password = "password123" }));
        var result = await service.AcceptInvitationAsync(new AcceptInvitationRequest { Token = resentToken, Password = "password123" });
        Assert.Equal(UserStatuses.Active, result.User.Status);
    }

    [Fact]
    public async Task AcceptInvitationAsync_TokenPersistsAcrossRepositoryRestart()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"shiftsync-invitation-{Guid.NewGuid():N}.db");
        try
        {
            var connectionString = $"Data Source={databasePath};Pooling=False";
            var emailSender = new CapturingInvitationEmailSender();
            var inviteService = CreateService(new SqliteUserRepository(connectionString), emailSender);
            await inviteService.BootstrapAdminAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" });
            await inviteService.InviteAsync(new InviteUserRequest { Email = "agent@example.test", FirstName = "Alex", LastName = "Agent" });
            var token = new Uri(emailSender.InvitationUrl!).Fragment["#token=".Length..];

            var acceptances = await Task.WhenAll(Enumerable.Range(0, 2).Select(async _ =>
            {
                var acceptanceService = CreateService(new SqliteUserRepository(connectionString));
                try
                {
                    return await acceptanceService.AcceptInvitationAsync(new AcceptInvitationRequest
                    {
                        Token = token,
                        Password = "password123"
                    });
                }
                catch (UnauthorizedAccessException)
                {
                    return null;
                }
            }));

            var result = Assert.Single(acceptances, acceptance => acceptance is not null);
            Assert.Equal(UserStatuses.Active, result!.User.Status);
            Assert.Equal(UserRoles.Agent, result.User.Role);
        }
        finally
        {
            foreach (var suffix in new[] { "", "-shm", "-wal" })
            {
                var file = databasePath + suffix;
                if (File.Exists(file)) File.Delete(file);
            }
        }
    }

    [Fact]
    public async Task SqliteUserRepository_MigratesExistingUserTableForInvitationTokens()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"shiftsync-legacy-users-{Guid.NewGuid():N}.db");
        var connectionString = $"Data Source={databasePath};Pooling=False";
        try
        {
            await using (var connection = new SqliteConnection(connectionString))
            {
                await connection.OpenAsync();
                await using var command = connection.CreateCommand();
                command.CommandText = """
                    CREATE TABLE users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
                        first_name TEXT NOT NULL,
                        last_name TEXT NOT NULL,
                        role TEXT NOT NULL,
                        status TEXT NOT NULL,
                        assigned_workplace_ids TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        password_hash TEXT NOT NULL
                    );
                    INSERT INTO users (email, first_name, last_name, role, status, assigned_workplace_ids, created_at, updated_at, password_hash)
                    VALUES ('existing@example.test', 'Existing', 'User', 'admin', 'active', '[]', '2026-01-01T00:00:00.0000000Z', '2026-01-01T00:00:00.0000000Z', 'hash');
                    """;
                await command.ExecuteNonQueryAsync();
            }

            var repository = new SqliteUserRepository(connectionString);
            var user = await repository.GetByEmailAsync("existing@example.test");
            Assert.Equal("existing@example.test", user?.Email);
            Assert.Null(user?.InvitationTokenHash);
        }
        finally
        {
            if (File.Exists(databasePath)) File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task InviteAsync_RemovesInvitationWhenEmailDeliveryFails()
    {
        var repository = new InMemoryUserRepository();
        var service = CreateService(repository, new FailingInvitationEmailSender());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.InviteAsync(new InviteUserRequest
            {
                Email = "agent@example.test",
                FirstName = "Alex",
                LastName = "Agent"
            }));

        Assert.Null(await repository.GetByEmailAsync("agent@example.test"));
    }

    [Fact]
    public async Task AcceptInvitationAsync_RejectsExpiredToken()
    {
        var repository = new InMemoryUserRepository();
        var emailSender = new CapturingInvitationEmailSender();
        var timeProvider = new TestTimeProvider(DateTimeOffset.UtcNow);
        var service = CreateService(repository, emailSender, timeProvider);
        await service.BootstrapAdminAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" });
        await service.InviteAsync(new InviteUserRequest { Email = "agent@example.test", FirstName = "Alex", LastName = "Agent" });
        var token = new Uri(emailSender.InvitationUrl!).Fragment["#token=".Length..];
        timeProvider.CurrentTime = timeProvider.CurrentTime.AddHours(49);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.AcceptInvitationAsync(new AcceptInvitationRequest { Token = token, Password = "password123" }));
    }
}
