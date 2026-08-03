using backend.Models;
using backend.Repositories;
using backend.Services;

namespace backend.Tests;

public class StudySessionServiceTests
{
    [Fact]
    public async Task CreateAsync_RejectsEndTimeBeforeStartTime()
    {
        var service = new StudySessionService(new InMemoryStudySessionRepository());

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Session("Invalid", new DateTime(2026, 7, 1, 10, 0, 0), new DateTime(2026, 7, 1, 9, 0, 0))));

        Assert.Equal("Study session end time must be after start time", exception.Message);
    }

    [Fact]
    public async Task GetAllAsync_FiltersAndOrdersSessions()
    {
        var service = new StudySessionService(new InMemoryStudySessionRepository());
        await service.CreateAsync(Session("Math early", new DateTime(2026, 7, 1, 9, 0, 0), new DateTime(2026, 7, 1, 10, 0, 0), subject: "Math"));
        await service.CreateAsync(Session("Science", new DateTime(2026, 7, 2, 9, 0, 0), new DateTime(2026, 7, 2, 10, 0, 0), subject: "Science"));
        await service.CreateAsync(Session("Math late", new DateTime(2026, 7, 3, 9, 0, 0), new DateTime(2026, 7, 3, 10, 0, 0), subject: "Math"));

        var results = await service.GetAllAsync(new DateTime(2026, 7, 1), new DateTime(2026, 7, 3), "Math", "lecture", "high");

        Assert.Equal(new[] { "Math late", "Math early" }, results.Select(x => x.Title));
    }

    [Fact]
    public async Task MarkCompleteAsync_SetsCompletionAndPersistsIt()
    {
        var service = new StudySessionService(new InMemoryStudySessionRepository());
        var created = await service.CreateAsync(Session("Revision", new DateTime(2026, 7, 1, 9, 0, 0), new DateTime(2026, 7, 1, 10, 0, 0)));

        var completed = await service.MarkCompleteAsync(created.Id);
        var stored = await service.GetByIdAsync(created.Id);

        Assert.NotNull(completed);
        Assert.True(completed.IsCompleted);
        Assert.NotNull(stored);
        Assert.True(stored.IsCompleted);
    }

    [Fact]
    public async Task UpdateAsync_ReplacesAllEditableFieldsAndReturnsNullForMissingSession()
    {
        var service = new StudySessionService(new InMemoryStudySessionRepository());
        var created = await service.CreateAsync(Session("Original", new DateTime(2026, 7, 1, 9, 0, 0), new DateTime(2026, 7, 1, 10, 0, 0)));
        var replacement = Session("Updated", new DateTime(2026, 7, 2, 10, 0, 0), new DateTime(2026, 7, 2, 12, 0, 0), "Science");
        replacement.SessionType = "lab";
        replacement.Priority = "urgent";
        replacement.IsCompleted = true;
        replacement.IsRecurring = true;

        var updated = await service.UpdateAsync(created.Id, replacement);

        Assert.NotNull(updated);
        Assert.Equal("Updated", updated.Title);
        Assert.Equal("Science", updated.Subject);
        Assert.Equal("lab", updated.SessionType);
        Assert.Equal("urgent", updated.Priority);
        Assert.True(updated.IsCompleted);
        Assert.Null(await service.UpdateAsync(404, replacement));
        Assert.Null(await service.MarkCompleteAsync(404));
    }

    [Theory]
    [InlineData("invalid", "high", "Invalid study session type")]
    [InlineData("lecture", "invalid", "Invalid study session priority")]
    public async Task CreateAsync_RejectsInvalidTypeOrPriority(string sessionType, string priority, string message)
    {
        var service = new StudySessionService(new InMemoryStudySessionRepository());
        var session = Session("Revision", new DateTime(2026, 7, 1, 9, 0, 0), new DateTime(2026, 7, 1, 10, 0, 0));
        session.SessionType = sessionType;
        session.Priority = priority;

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(session));

        Assert.Equal(message, exception.Message);
    }

    private static StudySessionDto Session(string title, DateTime start, DateTime end, string subject = "Math") => new()
    {
        Title = title,
        Subject = subject,
        StartDatetime = start,
        EndDatetime = end,
        SessionType = "lecture",
        Priority = "high"
    };
}
