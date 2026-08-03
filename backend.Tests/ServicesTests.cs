using backend.Models;
using backend.Repositories;
using backend.Services;

namespace backend.Tests;

public class ServicesTests
{
    [Fact]
    public async Task WorkplaceService_CreateAsync_RejectsInvalidPayload()
    {
        var repo = new InMemoryWorkplaceRepository();
        var service = new WorkplaceService(repo);

        var workplace = new WorkplaceDto
        {
            Name = string.Empty,
            PayType = "hourly",
            HourlyRate = 10m
        };

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(workplace));
    }

    [Fact]
    public async Task WorkplaceService_CreateAsync_AddsAndReturnsWorkplace()
    {
        var repo = new InMemoryWorkplaceRepository();
        var service = new WorkplaceService(repo);

        var result = await service.CreateAsync(new WorkplaceDto
        {
            Name = "Main Office",
            PayType = "monthly",
            MonthlySalary = 3000m
        });

        Assert.Equal(1, result.Id);
        Assert.Equal("Main Office", result.Name);
        Assert.True(result.CreatedAt > DateTime.MinValue);
    }

    [Fact]
    public async Task WorkplaceService_UpdateAndDeleteAsync_PersistsChangesAndReportsMissingRecords()
    {
        var service = new WorkplaceService(new InMemoryWorkplaceRepository());
        var created = await service.CreateAsync(new WorkplaceDto { Name = "Cafe", PayType = "hourly", HourlyRate = 12m });

        var updated = await service.UpdateAsync(created.Id, new WorkplaceDto
        {
            Name = "City Cafe", Color = "#123456", PayType = "monthly", MonthlySalary = 2500m, Address = "Main Street"
        });

        Assert.NotNull(updated);
        Assert.Equal("City Cafe", updated.Name);
        Assert.Equal("monthly", updated.PayType);
        Assert.Equal(2500m, updated.MonthlySalary);
        Assert.True(await service.DeleteAsync(created.Id));
        Assert.Null(await service.GetByIdAsync(created.Id));
        Assert.Null(await service.UpdateAsync(404, new WorkplaceDto { Name = "Missing", PayType = "hourly", HourlyRate = 1m }));
        Assert.False(await service.DeleteAsync(404));
    }

    [Theory]
    [InlineData("weekly", 10, null, "Pay type must be hourly or monthly")]
    [InlineData("hourly", 0, null, "Hourly rate must be greater than zero")]
    [InlineData("monthly", 0, null, "Monthly salary must be greater than zero")]
    public async Task WorkplaceService_CreateAsync_ValidatesPayDetails(string payType, decimal hourlyRate, decimal? monthlySalary, string message)
    {
        var service = new WorkplaceService(new InMemoryWorkplaceRepository());

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(new WorkplaceDto
        {
            Name = "Work", PayType = payType, HourlyRate = hourlyRate, MonthlySalary = monthlySalary
        }));

        Assert.Equal(message, exception.Message);
    }

    [Fact]
    public async Task ShiftService_CreateAsync_RejectsInvalidShift()
    {
        var repo = new InMemoryShiftRepository();
        var service = new ShiftService(repo);

        var invalidShift = new ShiftDto
        {
            WorkplaceId = 1,
            Title = "Test",
            StartDatetime = new DateTime(2026, 7, 1, 10, 0, 0, DateTimeKind.Utc),
            EndDatetime = new DateTime(2026, 7, 1, 9, 0, 0, DateTimeKind.Utc),
            BreakDuration = 0,
            ReminderEnabled = true,
            ReminderMinutesBefore = 45
        };

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(invalidShift));
    }

    [Fact]
    public async Task ShiftService_CreateAsync_AddsAndReturnsShift()
    {
        var repo = new InMemoryShiftRepository();
        var service = new ShiftService(repo);

        var result = await service.CreateAsync(new ShiftDto
        {
            WorkplaceId = 1,
            Title = "Opening Shift",
            StartDatetime = new DateTime(2026, 7, 1, 9, 0, 0, DateTimeKind.Utc),
            EndDatetime = new DateTime(2026, 7, 1, 17, 0, 0, DateTimeKind.Utc),
            BreakDuration = 30,
            ReminderEnabled = false
        });

        Assert.Equal(1, result.Id);
        Assert.Equal("Opening Shift", result.Title);
        Assert.NotNull(result.Workplace);
    }

    [Fact]
    public async Task ShiftService_FiltersByInclusiveEndDateAndOrdersNewestFirst()
    {
        var service = new ShiftService(new InMemoryShiftRepository());
        await service.CreateAsync(Shift("Early", 1, new DateTime(2026, 7, 1, 9, 0, 0), new DateTime(2026, 7, 1, 17, 0, 0)));
        await service.CreateAsync(Shift("Later", 1, new DateTime(2026, 7, 2, 9, 0, 0), new DateTime(2026, 7, 2, 17, 0, 0)));
        await service.CreateAsync(Shift("Other", 2, new DateTime(2026, 7, 2, 10, 0, 0), new DateTime(2026, 7, 2, 18, 0, 0)));

        var results = await service.GetAllAsync(new DateTime(2026, 7, 1), new DateTime(2026, 7, 2), 1);

        Assert.Equal(new[] { "Later", "Early" }, results.Select(x => x.Title));
    }

    [Fact]
    public async Task ShiftService_ConfirmClockInAndClockOutAsync_UpdatesLifecycle()
    {
        var service = new ShiftService(new InMemoryShiftRepository());
        var created = await service.CreateAsync(Shift("Work", 1, DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(9)));

        Assert.True((await service.ConfirmAsync(created.Id))!.IsConfirmed);
        var clockedIn = await service.ClockInAsync(created.Id);
        Assert.NotNull(clockedIn!.ActualStartTime);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ClockInAsync(created.Id));
        var clockedOut = await service.ClockOutAsync(created.Id);
        Assert.NotNull(clockedOut!.ActualEndTime);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ClockOutAsync(created.Id));
        Assert.Null(await service.ClockOutAsync(404));
    }

    [Fact]
    public async Task ShiftService_UpdateAsync_DisablesReminderAndReturnsNullForMissingShift()
    {
        var service = new ShiftService(new InMemoryShiftRepository());
        var created = await service.CreateAsync(Shift("Work", 1, new DateTime(2026, 7, 1, 9, 0, 0), new DateTime(2026, 7, 1, 17, 0, 0), reminderEnabled: true));

        var updated = await service.UpdateAsync(created.Id, Shift("Changed", 2, new DateTime(2026, 7, 2, 9, 0, 0), new DateTime(2026, 7, 2, 17, 0, 0)));

        Assert.NotNull(updated);
        Assert.Equal(2, updated.WorkplaceId);
        Assert.Null(updated.ReminderMinutesBefore);
        Assert.Equal("Changed", (await service.GetByIdAsync(created.Id))!.Title);
        Assert.True(await service.DeleteAsync(created.Id));
        Assert.False(await service.DeleteAsync(created.Id));
        Assert.Null(await service.UpdateAsync(404, Shift("Missing", 1, DateTime.UtcNow, DateTime.UtcNow.AddHours(1))));
    }

    private static ShiftDto Shift(string title, int workplaceId, DateTime start, DateTime end, bool reminderEnabled = false) => new()
    {
        Title = title, WorkplaceId = workplaceId, StartDatetime = start, EndDatetime = end, BreakDuration = 0,
        ReminderEnabled = reminderEnabled, ReminderMinutesBefore = reminderEnabled ? 30 : null
    };
}
