using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using StudentManagement.DTOs;
using StudentManagement.Entities;
using StudentManagement.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace StudentManagement.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<User> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
    }

    public async Task<AuthResult> RegisterAsync(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return new AuthResult { Success = false, Message = "Vui lòng nhập đầy đủ Username, Email và Password" };
        }

        if (await _userManager.FindByEmailAsync(dto.Email) != null)
            return new AuthResult { Success = false, Message = "Email đã tồn tại" };

        if (await _userManager.FindByNameAsync(dto.Username) != null)
            return new AuthResult { Success = false, Message = "Username đã tồn tại" };

        var user = new User
        {
            UserName = dto.Username.Trim(),
            Email = dto.Email.Trim(),
            NormalizedUserName = _userManager.NormalizeName(dto.Username),
            NormalizedEmail = _userManager.NormalizeEmail(dto.Email)
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return new AuthResult
            {
                Success = false,
                Message = "Tạo tài khoản thất bại",
                Errors = result.Errors.Select(e => e.Description)
            };

        await _userManager.AddToRoleAsync(user, "Student");

        return new AuthResult { Success = true, Message = "Đăng ký thành công" };
    }

    public async Task<LoginResult?> LoginAsync(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return null;

        var user = await _userManager.FindByEmailAsync(dto.Username)
                   ?? await _userManager.FindByNameAsync(dto.Username);

        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return null;

        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? "")
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            claims: claims,
            expires: DateTime.Now.AddHours(3),
            signingCredentials: creds);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new LoginResult
        {
            Token = tokenString,
            Role = roles.FirstOrDefault() ?? "Không có role",
            Username = user.UserName ?? "",
            Email = user.Email ?? "",
            UserId = user.Id
        };
    }

    public async Task<OperationResult> MakeAdminAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return OperationResult.Fail("Không tìm thấy user");

        if (!await _roleManager.RoleExistsAsync("Admin"))
            await _roleManager.CreateAsync(new IdentityRole("Admin"));

        var result = await _userManager.AddToRoleAsync(user, "Admin");
        if (!result.Succeeded)
            return OperationResult.Fail("Gán role thất bại", result.Errors.Select(e => e.Description));

        await _userManager.UpdateSecurityStampAsync(user);

        return OperationResult.Ok("Đã gán role Admin thành công! Đăng nhập lại để sử dụng.");
    }
}