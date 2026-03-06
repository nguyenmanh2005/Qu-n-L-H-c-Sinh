using System.ComponentModel.DataAnnotations;

namespace StudentManagement.DTOs;

public class CreateUserDto
{
    [Required] public string Username { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    [Required] public string Role { get; set; } = "Student";
}