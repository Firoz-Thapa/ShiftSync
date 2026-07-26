using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class NoticeService : INoticeService
{
    private readonly INoticeRepository _repository;

    public NoticeService(INoticeRepository repository)
    {
        _repository = repository;
    }

    public async Task<PaginatedResponse<NoticeDto>> GetByWorkplaceAsync(int workplaceId, int page, int pageSize)
    {
        var all = await _repository.GetByWorkplaceAsync(workplaceId);
        var totalItems = all.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var paginated = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PaginatedResponse<NoticeDto>
        {
            Data = paginated,
            Pagination = new PaginationMetadata
            {
                CurrentPage = page,
                TotalPages = totalPages,
                TotalItems = totalItems,
                ItemsPerPage = pageSize
            }
        };
    }

    public Task<NoticeDto?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public async Task<NoticeDto> CreateAsync(int workplaceId, CreateNoticeRequest request)
    {
        var validation = ValidateCreateRequest(request);
        if (validation is not null) throw new ArgumentException(validation);

        var notice = new NoticeDto
        {
            WorkplaceId = workplaceId,
            CreatedByUserId = 1,
            CreatedByUserName = "User",
            Title = request.Title,
            Content = request.Content,
            Category = request.Category,
            Tags = request.Tags,
            IsPinned = request.IsPinned,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return await _repository.CreateAsync(notice);
    }

    public async Task<NoticeDto?> UpdateAsync(int id, UpdateNoticeRequest request)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null) return null;

        if (!string.IsNullOrWhiteSpace(request.Title)) existing.Title = request.Title;
        if (!string.IsNullOrWhiteSpace(request.Content)) existing.Content = request.Content;
        if (!string.IsNullOrWhiteSpace(request.Category)) existing.Category = request.Category;
        if (request.Tags != null) existing.Tags = request.Tags;
        if (request.IsPinned.HasValue) existing.IsPinned = request.IsPinned.Value;

        existing.UpdatedAt = DateTime.UtcNow;

        return await _repository.UpdateAsync(existing);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);

    private static string? ValidateCreateRequest(CreateNoticeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) return "Notice title is required";
        if (string.IsNullOrWhiteSpace(request.Content)) return "Notice content is required";
        if (request.Title.Length > 200) return "Notice title cannot exceed 200 characters";
        if (request.Content.Length > 5000) return "Notice content cannot exceed 5000 characters";
        return null;
    }
}
