using backend.Models;
using backend.Repositories;
using backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace backend.Tests;

public class UserServiceTests
{
    private static UserService CreateService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:Key"] = "test-key-that-is-long-enough-for-hmac-signing" })
            .Build();
        return new UserService(new InMemoryUserRepository(), new PasswordHasher<UserRecord>(), config);
    }

    [Fact]
    public async Task RegisterAsync_FirstAccountBecomesActiveAdmin_AndSubsequentAccountIsAgent()
    {
        var service = CreateService();
        var first = await service.RegisterAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" });
        var second = await service.RegisterAsync(new RegisterRequest { Email = "agent@example.test", Password = "password123", FirstName = "Alex", LastName = "Agent" });

        Assert.Equal(UserRoles.Admin, first.User.Role);
        Assert.Equal(UserStatuses.Active, first.User.Status);
        Assert.Equal(UserRoles.Agent, second.User.Role);
        Assert.NotEmpty(first.Token);
    }

    [Fact]
    public async Task UpdateAsync_RejectsDeactivatingFinalActiveAdmin()
    {
        var service = CreateService();
        var admin = await service.RegisterAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" });

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(admin.User.Id, new UpdateUserRequest { Status = UserStatuses.Deactivated }));

        Assert.Equal("At least one active admin must remain.", exception.Message);
    }

    [Fact]
    public async Task InviteAndAcceptInvitation_ActivatesAssignedAgent()
    {
        var service = CreateService();
        await service.RegisterAsync(new RegisterRequest { Email = "admin@example.test", Password = "password123", FirstName = "Ada", LastName = "Admin" });
        var invited = await service.InviteAsync(new InviteUserRequest { Email = "agent@example.test", FirstName = "Alex", LastName = "Agent", AssignedWorkplaceIds = [2, 2, 5] });
        var result = await service.AcceptInvitationAsync(new AcceptInvitationRequest { Email = invited.Email, Password = "password123" });

        Assert.Equal(UserStatuses.Invited, invited.Status);
        Assert.Equal(UserStatuses.Active, result.User.Status);
        Assert.Equal([2, 5], result.User.AssignedWorkplaceIds);
    }
}
