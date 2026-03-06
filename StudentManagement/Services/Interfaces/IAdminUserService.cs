using StudentManagement.Entities;
using StudentManagement.Data;
using StudentManagement.DTOs;
using StudentManagement.Services;
using StudentManagement.Services.Interfaces;

namespace StudentManagement.Services.Interfaces;

public interface IAdminUserService
{
    Task<List<UserWithRoleDto>> GetAllUsersWithRolesAsync();
    Task<UserWithRoleDto?> GetUserByIdAsync(string id);
    Task<OperationResult> UpdateUserInfoAsync(string id, UpdateUserDto dto);
    Task<OperationResult> DeleteUserAsync(string id, string currentUserId);
    Task<OperationResult> AssignRoleAsync(string userId, string roleName, AppDbContext context);
    Task<OperationResult<UserCreatedDto>> CreateUserAsync(CreateUserDto dto, AppDbContext context);
}


// public class UserWithRoleDto
// {
//     public string Id { get; set; } = string.Empty;
//     public string? UserName { get; set; }
//     public string? Email { get; set; }
//     public string Role { get; set; } = "Chưa có role";
// }

// public class UserCreatedDto
// {
//     public string Id { get; set; } = string.Empty;
//     public string UserName { get; set; } = string.Empty;
//     public string? Email { get; set; }
//     public string Role { get; set; } = string.Empty;
// }

