using backend.Models;

namespace backend.Services;

public interface IUserService
{
    Task<AuthResultDto> RegisterAsync(RegisterRequest request);
    Task<AuthResultDto> LoginAsync(LoginRequest request);
    Task<AuthResultDto> AcceptInvitationAsync(AcceptInvitationRequest request);
    Task<UserDto?> GetProfileAsync(int id);
    Task<List<UserDto>> GetAllAsync();
    Task<UserDto> InviteAsync(InviteUserRequest request);
    Task<UserDto?> UpdateAsync(int id, UpdateUserRequest request);
    Task<bool> CanAccessWorkplaceAsync(int userId, int workplaceId);
}
