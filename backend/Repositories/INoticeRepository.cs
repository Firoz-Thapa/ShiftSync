using backend.Models;

namespace backend.Repositories;

public interface INoticeRepository
{
    Task<List<NoticeDto>> GetByWorkplaceAsync(int workplaceId);
    Task<NoticeDto?> GetByIdAsync(int id);
    Task<NoticeDto> CreateAsync(NoticeDto notice);
    Task<NoticeDto?> UpdateAsync(NoticeDto notice);
    Task<bool> DeleteAsync(int id);
}
