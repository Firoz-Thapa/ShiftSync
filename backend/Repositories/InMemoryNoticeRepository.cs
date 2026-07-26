using backend.Models;

namespace backend.Repositories;

public class InMemoryNoticeRepository : INoticeRepository
{
    private readonly List<NoticeDto> _notices = new();
    private int _nextId = 1;
    private readonly object _lock = new();

    private static NoticeDto Clone(NoticeDto n) => new()
    {
        Id = n.Id,
        WorkplaceId = n.WorkplaceId,
        CreatedByUserId = n.CreatedByUserId,
        CreatedByUserName = n.CreatedByUserName,
        Title = n.Title,
        Content = n.Content,
        Category = n.Category,
        Tags = n.Tags is null ? new List<string>() : new List<string>(n.Tags),
        Attachments = n.Attachments is null ? new List<AttachmentDto>() : n.Attachments.Select(a => new AttachmentDto { Id = a.Id, FileName = a.FileName, FileUrl = a.FileUrl, FileType = a.FileType, FileSize = a.FileSize }).ToList(),
        IsPinned = n.IsPinned,
        CreatedAt = n.CreatedAt,
        UpdatedAt = n.UpdatedAt
    };

    public Task<List<NoticeDto>> GetByWorkplaceAsync(int workplaceId)
    {
        lock (_lock)
        {
            return Task.FromResult(_notices.Where(n => n.WorkplaceId == workplaceId).Select(Clone).OrderByDescending(n => n.IsPinned).ThenByDescending(n => n.CreatedAt).ToList());
        }
    }

    public Task<NoticeDto?> GetByIdAsync(int id)
    {
        lock (_lock)
        {
            var found = _notices.FirstOrDefault(x => x.Id == id);
            return Task.FromResult(found is null ? null : Clone(found));
        }
    }

    public Task<NoticeDto> CreateAsync(NoticeDto notice)
    {
        lock (_lock)
        {
            notice.Id = _nextId++;
            _notices.Add(Clone(notice));
            return Task.FromResult(Clone(notice));
        }
    }

    public Task<NoticeDto?> UpdateAsync(NoticeDto notice)
    {
        lock (_lock)
        {
            var idx = _notices.FindIndex(x => x.Id == notice.Id);
            if (idx == -1) return Task.FromResult<NoticeDto?>(null);
            _notices[idx] = Clone(notice);
            return Task.FromResult<NoticeDto?>(Clone(notice));
        }
    }

    public Task<bool> DeleteAsync(int id)
    {
        lock (_lock)
        {
            var existing = _notices.FirstOrDefault(x => x.Id == id);
            if (existing is null) return Task.FromResult(false);
            _notices.Remove(existing);
            return Task.FromResult(true);
        }
    }
}
