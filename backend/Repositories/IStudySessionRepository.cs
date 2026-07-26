using backend.Models;

namespace backend.Repositories;

public interface IStudySessionRepository
{
    Task<List<StudySessionDto>> GetAllAsync();
    Task<StudySessionDto?> GetByIdAsync(int id);
    Task<StudySessionDto> CreateAsync(StudySessionDto session);
    Task<StudySessionDto?> UpdateAsync(StudySessionDto session);
    Task<bool> DeleteAsync(int id);
}
