using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentManagement.DTOs;
using StudentManagement.Services.Interfaces;

namespace StudentManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);

        if (result.Success)
            return Ok(new { Message = result.Message });

        return BadRequest(new { Message = result.Message, Errors = result.Errors });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var loginResult = await _authService.LoginAsync(dto);

        if (loginResult == null)
            return Unauthorized(new { Message = "Sai tài khoản hoặc mật khẩu" });

        return Ok(loginResult);
    }

    [HttpPost("make-admin")]
    [AllowAnonymous]
    public async Task<IActionResult> MakeAdmin([FromBody] MakeAdminDto dto)
    {
        var result = await _authService.MakeAdminAsync(dto.UserId);

        if (result.Success)
            return Ok(new { Message = result.Message });

        return BadRequest(new { Message = result.Message, Errors = result.Errors });
    }
}

public class MakeAdminDto
{
    public string UserId { get; set; } = string.Empty;
}