using backend.Models;

namespace backend.Services;

public interface INoticeService
{
    Task<PaginatedResponse<NoticeDto>> GetByWorkplaceAsync(int workplaceId, int page, int pageSize);
    Task<NoticeDto?> GetByIdAsync(int id);
    Task<NoticeDto> CreateAsync(int workplaceId, CreateNoticeRequest request);
    Task<NoticeDto?> UpdateAsync(int id, UpdateNoticeRequest request);
    Task<bool> DeleteAsync(int id);
}
