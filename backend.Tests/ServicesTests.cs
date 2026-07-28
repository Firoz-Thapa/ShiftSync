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
}
