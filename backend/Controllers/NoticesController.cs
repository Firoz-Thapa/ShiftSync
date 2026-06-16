using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NoticesController : ControllerBase
{
    private static readonly List<NoticeDto> Notices = new();
    private static int _noticeIdCounter = 1;

    [HttpGet("workplace/{workplaceId:int}")]
    public ActionResult<ApiResponse<PaginatedResponse<NoticeDto>>> GetByWorkplace(int workplaceId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var workplaceNotices = Notices
            .Where(n => n.WorkplaceId == workplaceId)
            .OrderByDescending(n => n.IsPinned)
            .ThenByDescending(n => n.CreatedAt)
            .ToList();

        var totalItems = workplaceNotices.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var paginatedNotices = workplaceNotices
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new PaginatedResponse<NoticeDto>
        {
            Data = paginatedNotices,
            Pagination = new PaginationMetadata
            {
                CurrentPage = page,
                TotalPages = totalPages,
                TotalItems = totalItems,
                ItemsPerPage = pageSize
            }
        };

        return Ok(ApiResponse<PaginatedResponse<NoticeDto>>.Ok(response));
    }

    [HttpGet("{id:int}")]
    public ActionResult<ApiResponse<NoticeDto>> GetById(int id)
    {
        var notice = Notices.FirstOrDefault(x => x.Id == id);
        if (notice is null)
        {
            return NotFound(ApiResponse<NoticeDto>.Fail("Notice not found"));
        }

        return Ok(ApiResponse<NoticeDto>.Ok(notice));
    }

    [HttpPost("workplace/{workplaceId:int}")]
    public ActionResult<ApiResponse<NoticeDto>> Create(int workplaceId, [FromBody] CreateNoticeRequest request)
    {
        var validationError = ValidateCreateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(ApiResponse<NoticeDto>.Fail(validationError));
        }

        var notice = new NoticeDto
        {
            Id = _noticeIdCounter++,
            WorkplaceId = workplaceId,
            CreatedByUserId = 1, // In a real app, this would come from the authenticated user
            CreatedByUserName = "User", // In a real app, this would come from the authenticated user
            Title = request.Title,
            Content = request.Content,
            Category = request.Category,
            Tags = request.Tags,
            IsPinned = request.IsPinned,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Notices.Add(notice);

        return CreatedAtAction(nameof(GetById), new { id = notice.Id }, ApiResponse<NoticeDto>.Ok(notice, "Notice created successfully"));
    }

    [HttpPut("{id:int}")]
    public ActionResult<ApiResponse<NoticeDto>> Update(int id, [FromBody] UpdateNoticeRequest request)
    {
        var existing = Notices.FirstOrDefault(x => x.Id == id);
        if (existing is null)
        {
            return NotFound(ApiResponse<NoticeDto>.Fail("Notice not found"));
        }

        if (!string.IsNullOrWhiteSpace(request.Title))
            existing.Title = request.Title;
        if (!string.IsNullOrWhiteSpace(request.Content))
            existing.Content = request.Content;
        if (!string.IsNullOrWhiteSpace(request.Category))
            existing.Category = request.Category;
        if (request.Tags != null)
            existing.Tags = request.Tags;
        if (request.IsPinned.HasValue)
            existing.IsPinned = request.IsPinned.Value;

        existing.UpdatedAt = DateTime.UtcNow;

        return Ok(ApiResponse<NoticeDto>.Ok(existing, "Notice updated successfully"));
    }

    [HttpDelete("{id:int}")]
    public ActionResult<ApiResponse<object>> Delete(int id)
    {
        var notice = Notices.FirstOrDefault(x => x.Id == id);
        if (notice is null)
        {
            return NotFound(ApiResponse<object>.Fail("Notice not found"));
        }

        Notices.Remove(notice);
        return Ok(ApiResponse<object>.Ok(null, "Notice deleted successfully"));
    }

    private static string? ValidateCreateRequest(CreateNoticeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return "Notice title is required";
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return "Notice content is required";
        }

        if (request.Title.Length > 200)
        {
            return "Notice title cannot exceed 200 characters";
        }

        if (request.Content.Length > 5000)
        {
            return "Notice content cannot exceed 5000 characters";
        }

        return null;
    }
}
