// using System.ComponentModel.DataAnnotations;
public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;

    
}

// public class CreateUserDto
// {
//     [Required(ErrorMessage = "Username là bắt buộc")]
//     public string Username { get; set; } = string.Empty;

//     [Required(ErrorMessage = "Password là bắt buộc")]
//     public string Password { get; set; } = string.Empty;

//     public string Email { get; set; } = string.Empty;

//     [Required(ErrorMessage = "Role là bắt buộc")]
//     public string Role { get; set; } = "Student";
// }
