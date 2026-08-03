using backend.Models;
using backend.Repositories;
using backend.Services;

namespace backend.Tests;

public class NoticeServiceTests
{
    [Fact]
    public async Task CreateAsync_RejectsMissingTitle()
    {
        var service = new NoticeService(new InMemoryNoticeRepository());

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(1, new CreateNoticeRequest
        {
            Content = "Important update"
        }));

        Assert.Equal("Notice title is required", exception.Message);
    }

    [Fact]
    public async Task GetByWorkplaceAsync_PaginatesNoticesAndKeepsPinnedFirst()
    {
        var service = new NoticeService(new InMemoryNoticeRepository());
        await service.CreateAsync(1, new CreateNoticeRequest { Title = "First", Content = "Content" });
        await service.CreateAsync(1, new CreateNoticeRequest { Title = "Pinned", Content = "Content", IsPinned = true });
        await service.CreateAsync(1, new CreateNoticeRequest { Title = "Third", Content = "Content" });
        await service.CreateAsync(2, new CreateNoticeRequest { Title = "Other workplace", Content = "Content" });

        var result = await service.GetByWorkplaceAsync(1, page: 1, pageSize: 2);

        Assert.Equal(3, result.Pagination.TotalItems);
        Assert.Equal(2, result.Pagination.TotalPages);
        Assert.Equal(new[] { "Pinned", "Third" }, result.Data.Select(x => x.Title));
    }

    [Fact]
    public async Task UpdateAsync_OnlyChangesSuppliedFields()
    {
        var service = new NoticeService(new InMemoryNoticeRepository());
        var created = await service.CreateAsync(1, new CreateNoticeRequest
        {
            Title = "Original", Content = "Keep this", Category = "general", Tags = ["old"]
        });

        var updated = await service.UpdateAsync(created.Id, new UpdateNoticeRequest { Title = "Updated", IsPinned = true });

        Assert.NotNull(updated);
        Assert.Equal("Updated", updated.Title);
        Assert.Equal("Keep this", updated.Content);
        Assert.Equal("general", updated.Category);
        Assert.Equal(new[] { "old" }, updated.Tags);
        Assert.True(updated.IsPinned);
        Assert.True(updated.UpdatedAt >= created.UpdatedAt);
    }

    [Fact]
    public async Task NoticeService_ReturnsNullForMissingUpdateAndSupportsDeletion()
    {
        var service = new NoticeService(new InMemoryNoticeRepository());
        var created = await service.CreateAsync(1, new CreateNoticeRequest { Title = "Delete", Content = "This will go" });

        Assert.Null(await service.UpdateAsync(404, new UpdateNoticeRequest { Title = "Missing" }));
        Assert.True(await service.DeleteAsync(created.Id));
        Assert.Null(await service.GetByIdAsync(created.Id));
        Assert.False(await service.DeleteAsync(created.Id));
    }

    [Theory]
    [InlineData("", "Content", "Notice title is required")]
    [InlineData("Title", "", "Notice content is required")]
    public async Task CreateAsync_ValidatesRequiredFields(string title, string content, string message)
    {
        var service = new NoticeService(new InMemoryNoticeRepository());

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(1, new CreateNoticeRequest { Title = title, Content = content }));

        Assert.Equal(message, exception.Message);
    }
}
