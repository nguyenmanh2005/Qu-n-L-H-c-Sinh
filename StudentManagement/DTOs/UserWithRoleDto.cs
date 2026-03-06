namespace StudentManagement.DTOs;
// UserWithRoleDto.cs - thêm các field còn thiếu
public class UserWithRoleDto
{
    public string Id { get; set; } = "";
    public string? UserName { get; set; }
    public string? FullName { get; set; }           // ← thêm
    public string? Email { get; set; }
    public bool EmailConfirmed { get; set; }         // ← thêm
    public string? PhoneNumber { get; set; }         // ← thêm
    public bool PhoneNumberConfirmed { get; set; }   // ← thêm
    public bool TwoFactorEnabled { get; set; }       // ← thêm
    public string Role { get; set; } = "";
}