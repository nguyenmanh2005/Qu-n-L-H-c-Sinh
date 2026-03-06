using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Entities;
using StudentManagement.Repositories.Interfaces;
using StudentManagement.Services.Interfaces;
using StudentManagement.Data;
using StudentManagement.DTOs;

namespace StudentManagement.Services;

public class AdminUserService : IAdminUserService
{
    private readonly IUserRepository _userRepository;

    public AdminUserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

// AdminUserService.cs - map đủ field
public async Task<List<UserWithRoleDto>> GetAllUsersWithRolesAsync()
{
    var users = await _userRepository.Users.ToListAsync();
    var result = new List<UserWithRoleDto>();

    foreach (var user in users)
    {
        var roles = await _userRepository.GetRolesAsync(user);
        result.Add(new UserWithRoleDto
        {
            Id                   = user.Id,
            UserName             = user.UserName,
            FullName             = user.FullName,              // ← thêm
            Email                = user.Email,
            EmailConfirmed       = user.EmailConfirmed,        // ← thêm
            PhoneNumber          = user.PhoneNumber,           // ← thêm
            PhoneNumberConfirmed = user.PhoneNumberConfirmed,  // ← thêm
            TwoFactorEnabled     = user.TwoFactorEnabled,      // ← thêm
            Role                 = roles.FirstOrDefault() ?? "Chưa có role"
        });
    }
    return result;
}

public async Task<UserWithRoleDto?> GetUserByIdAsync(string id)
{
    var user = await _userRepository.FindByIdAsync(id);
    if (user == null) return null;

    var roles = await _userRepository.GetRolesAsync(user);
    return new UserWithRoleDto
    {
        Id                   = user.Id,
        UserName             = user.UserName,
        FullName             = user.FullName,              // ← thêm
        Email                = user.Email,
        EmailConfirmed       = user.EmailConfirmed,        // ← thêm
        PhoneNumber          = user.PhoneNumber,           // ← thêm
        PhoneNumberConfirmed = user.PhoneNumberConfirmed,  // ← thêm
        TwoFactorEnabled     = user.TwoFactorEnabled,      // ← thêm
        Role                 = roles.FirstOrDefault() ?? "Chưa có role"
    };
}

public async Task<OperationResult> UpdateUserInfoAsync(string id, UpdateUserDto dto)
    {
        var user = await _userRepository.FindByIdAsync(id);
        if (user == null) return OperationResult.Fail("Không tìm thấy người dùng");

        bool changed = false;

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            user.Email = dto.Email.Trim();
            user.NormalizedEmail = dto.Email.Trim().ToUpperInvariant();
            changed = true;
        }

        if (!string.IsNullOrWhiteSpace(dto.UserName))
        {
            user.UserName = dto.UserName.Trim();
            user.NormalizedUserName = dto.UserName.Trim().ToUpperInvariant();
            changed = true;
        }

        if (!string.IsNullOrWhiteSpace(dto.FullName))
        {
            user.FullName = dto.FullName.Trim();
            changed = true;
        }

        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            user.PhoneNumber = dto.PhoneNumber.Trim();
            changed = true;
        }

        // ✅ Dùng .HasValue thay vì TryParse string
        if (dto.EmailConfirmed.HasValue)
        {
            user.EmailConfirmed = dto.EmailConfirmed.Value;
            changed = true;
        }

        if (dto.PhoneNumberConfirmed.HasValue)
        {
            user.PhoneNumberConfirmed = dto.PhoneNumberConfirmed.Value;
            changed = true;
        }

        if (!changed) return OperationResult.Fail("Không có thay đổi nào");

        var result = await _userRepository.UpdateAsync(user);
        return result.Succeeded
            ? OperationResult.Ok("Cập nhật thành công")
            : OperationResult.Fail("Cập nhật thất bại", result.Errors.Select(e => e.Description));
    }

    // TRƯỚC KHI UPDATE

    // public async Task<OperationResult> UpdateUserInfoAsync(string id, UpdateUserDto dto)
    // {
    //     var user = await _userRepository.FindByIdAsync(id);
    //     if (user == null) return OperationResult.Fail("Không tìm thấy người dùng");

    //     bool changed = false;

    //     if (!string.IsNullOrWhiteSpace(dto.Email))
    //     {
    //         user.Email = dto.Email.Trim();
    //         changed = true;
    //     }

    //     if (!string.IsNullOrWhiteSpace(dto.UserName))
    //     {
    //         user.UserName = dto.UserName.Trim();
    //         changed = true;
    //     }

    //     if (!changed) return OperationResult.Fail("Không có thay đổi nào");

    //     var result = await _userRepository.UpdateAsync(user);
    //     return result.Succeeded
    //         ? OperationResult.Ok("Cập nhật thành công")
    //         : OperationResult.Fail("Cập nhật thất bại", result.Errors.Select(e => e.Description));
    // }

    public async Task<OperationResult> DeleteUserAsync(string id, string currentUserId)
    {
        if (id == currentUserId)
            return OperationResult.Fail("Không thể xóa chính tài khoản đang đăng nhập");

        var user = await _userRepository.FindByIdAsync(id);
        if (user == null) return OperationResult.Fail("Không tìm thấy người dùng");

        var result = await _userRepository.DeleteAsync(user);
        return result.Succeeded
            ? OperationResult.Ok("Xóa thành công")
            : OperationResult.Fail("Xóa thất bại", result.Errors.Select(e => e.Description));
    }

    public async Task<OperationResult> AssignRoleAsync(string userId, string roleName, AppDbContext context)
    {
        var user = await _userRepository.FindByIdAsync(userId);
        if (user == null) return OperationResult.Fail("Không tìm thấy người dùng");

        if (!await _userRepository.RoleExistsAsync(roleName))
            return OperationResult.Fail($"Role '{roleName}' không tồn tại");

        var currentRoles = await _userRepository.GetRolesAsync(user);

        if (currentRoles.Any())
        {
            var remove = await _userRepository.RemoveFromRolesAsync(user, currentRoles);
            if (!remove.Succeeded) return OperationResult.Fail("Xóa role cũ thất bại", remove.Errors.Select(e => e.Description));

            if (currentRoles.Contains("Teacher"))
            {
                var t = await context.Teachers.FirstOrDefaultAsync(x => x.UserId == user.Id);
                if (t != null) context.Teachers.Remove(t);
            }
            if (currentRoles.Contains("Student"))
            {
                var s = await context.Students.FirstOrDefaultAsync(x => x.UserId == user.Id);
                if (s != null) context.Students.Remove(s);
            }
            await context.SaveChangesAsync();
        }

        var add = await _userRepository.AddToRoleAsync(user, roleName);
        if (!add.Succeeded) return OperationResult.Fail("Gán role mới thất bại", add.Errors.Select(e => e.Description));

        await _userRepository.UpdateSecurityStampAsync(user);

        if (roleName == "Teacher" && !await context.Teachers.AnyAsync(t => t.UserId == user.Id))
        {
            context.Teachers.Add(new Teacher { FullName = user.FullName ?? user.UserName ?? "", UserId = user.Id });
        }
        if (roleName == "Student" && !await context.Students.AnyAsync(s => s.UserId == user.Id))
        {
            context.Students.Add(new Student { FullName = user.FullName ?? user.UserName ?? "", UserId = user.Id });
        }
        await context.SaveChangesAsync();

        return OperationResult.Ok($"Đã gán role '{roleName}'");
    }

    public async Task<OperationResult<UserCreatedDto>> CreateUserAsync(CreateUserDto dto, AppDbContext context)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return OperationResult<UserCreatedDto>.Fail("Username và Password bắt buộc");

        if (await _userRepository.FindByNameAsync(dto.Username) != null)
            return OperationResult<UserCreatedDto>.Fail($"Username '{dto.Username}' đã tồn tại");

        if (!await _userRepository.RoleExistsAsync(dto.Role))
            return OperationResult<UserCreatedDto>.Fail($"Role '{dto.Role}' không tồn tại");

        var user = new User
        {
            UserName = dto.Username.Trim(),
            Email = dto.Email?.Trim() ?? $"{dto.Username}@example.com",
            EmailConfirmed = true
        };

        var create = await _userRepository.CreateAsync(user, dto.Password);
        if (!create.Succeeded)
            return OperationResult<UserCreatedDto>.Fail("Tạo user thất bại", create.Errors.Select(e => e.Description));

        await _userRepository.AddToRoleAsync(user, dto.Role);

        if (dto.Role == "Teacher")
            context.Teachers.Add(new Teacher { FullName = user.FullName ?? user.UserName ?? "", UserId = user.Id });
        if (dto.Role == "Student")
            context.Students.Add(new Student { FullName = user.FullName ?? user.UserName ?? "", UserId = user.Id });

        await context.SaveChangesAsync();

        return OperationResult<UserCreatedDto>.Ok("Tạo thành công", new UserCreatedDto
        {
            Id = user.Id,
            UserName = user.UserName!,
            Email = user.Email,
            Role = dto.Role
        });
    }
}