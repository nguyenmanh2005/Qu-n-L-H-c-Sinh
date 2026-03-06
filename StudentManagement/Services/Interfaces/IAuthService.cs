using StudentManagement.DTOs;
using System.Threading.Tasks;

namespace StudentManagement.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterDto dto);
    Task<LoginResult?> LoginAsync(LoginDto dto);
    Task<OperationResult> MakeAdminAsync(string userId);
}

public class AuthResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public IEnumerable<string>? Errors { get; set; }
}

public class LoginResult
{
    public string Token { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public required string Username { get; set; } = string.Empty;
    public required string Email { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
}