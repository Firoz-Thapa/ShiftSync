using backend.Models;

namespace backend.Services;

public interface IStudySessionService
{
    Task<List<StudySessionDto>> GetAllAsync(DateTime? startDate, DateTime? endDate, string? subject, string? sessionType, string? priority);
    Task<StudySessionDto?> GetByIdAsync(int id);
    Task<StudySessionDto> CreateAsync(StudySessionDto session);
    Task<StudySessionDto?> UpdateAsync(int id, StudySessionDto session);
    Task<bool> DeleteAsync(int id);
    Task<StudySessionDto?> MarkCompleteAsync(int id);
}
