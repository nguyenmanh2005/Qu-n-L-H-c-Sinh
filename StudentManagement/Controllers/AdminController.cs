using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StudentManagement.DTOs;
using StudentManagement.Services.Interfaces;
using StudentManagement.Data;
using StudentManagement.Utils;

namespace StudentManagement.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminUserService _userService;
    private readonly IAdminClassService _classService;

    public AdminController(IAdminUserService userService, IAdminClassService classService)
    {
        _userService  = userService;
        _classService = classService;
    }

    // ── SLOT DEFINITIONS ────────────────────────────────────────────────

    /// <summary>
    /// Trả về danh sách 7 slot học cố định.
    /// Frontend dùng endpoint này để hiển thị dropdown chọn slot.
    /// </summary>
    [HttpGet("slots")]
    public IActionResult GetSlots()
    {
        var slots = SlotDefinition.All.Select(s => new
        {
            slotNumber = s.Number,
            label      = s.Label,
            timeStart  = s.TimeStart,
            timeEnd    = s.TimeEnd,
        });
        return Ok(slots);
    }

    // ── USER MANAGEMENT ─────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
        => Ok(await _userService.GetAllUsersWithRolesAsync());

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(string id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        return user != null ? Ok(user) : NotFound("Không tìm thấy người dùng");
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        var result = await _userService.UpdateUserInfoAsync(id, dto);
        return result.Success ? Ok(result.Message) : BadRequest(new { result.Message, result.Errors });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var currentId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result    = await _userService.DeleteUserAsync(id, currentId);
        return result.Success ? Ok(result.Message) : BadRequest(new { result.Message, result.Errors });
    }

    [HttpPost("users/{id}/assign-role")]
    public async Task<IActionResult> AssignRole(string id, [FromBody] RoleAssignmentDto dto, [FromServices] AppDbContext context)
    {
        var result = await _userService.AssignRoleAsync(id, dto.RoleName, context);
        return result.Success ? Ok(result.Message) : BadRequest(new { result.Message, result.Errors });
    }

    [HttpPost("create-user")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto, [FromServices] AppDbContext context)
    {
        var result = await _userService.CreateUserAsync(dto, context);
        if (!result.Success) return BadRequest(new { result.Message, result.Errors });
        return Ok(result.Data);
    }

    // ── CLASS MANAGEMENT ────────────────────────────────────────────────

    [HttpGet("classes")]
    public async Task<IActionResult> GetAllClasses()
        => Ok(await _classService.GetAllClassesAsync());

    [HttpPost("classes")]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassAdminDto dto, [FromServices] AppDbContext context)
    {
        var result = await _classService.CreateClassAsync(dto, context);
        return result.Success ? Ok(new { message = result.Message, data = result.Data }) : BadRequest(result.Message);
    }

    [HttpDelete("classes/{classId}")]
    public async Task<IActionResult> DeleteClass(int classId, [FromServices] AppDbContext context)
    {
        var result = await _classService.DeleteClassAsync(classId, context);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }

    [HttpPut("classes/{classId}/assign-teacher")]
    public async Task<IActionResult> AssignTeacher(int classId, [FromBody] AssignTeacherDto dto, [FromServices] AppDbContext context)
    {
        var result = await _classService.AssignTeacherAsync(classId, dto, context);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }

    /// <summary>
    /// Cập nhật lịch học cho lớp.
    /// Admin có thể truyền SlotNumber (1–7) thay vì nhập giờ thủ công.
    /// Ví dụ body: { "slotNumber": 2, "schedule": "Thứ 2, Thứ 4 – P.A101", "startDate": "2025-09-01" }
    /// </summary>
    [HttpPut("classes/{classId}/schedule")]
    public async Task<IActionResult> UpdateSchedule(int classId, [FromBody] UpdateScheduleDto dto, [FromServices] AppDbContext context)
    {
        // Validate slot nếu được cung cấp
        if (dto.SlotNumber.HasValue && !SlotDefinition.IsValid(dto.SlotNumber.Value))
            return BadRequest($"SlotNumber không hợp lệ. Giá trị hợp lệ: 1–{SlotDefinition.All.Count}.");

        var result = await _classService.UpdateScheduleAsync(classId, dto, context);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }

    [HttpGet("classes/{classId}/students")]
    public async Task<IActionResult> GetStudentsInClass(int classId, [FromServices] AppDbContext context)
    {
        var data = await _classService.GetStudentsInClassAsync(classId, context);
        return Ok(data);
    }

    [HttpDelete("enrollments/{enrollmentId}")]
    public async Task<IActionResult> RemoveEnrollment(int enrollmentId, [FromServices] AppDbContext context)
    {
        var result = await _classService.RemoveEnrollmentAsync(enrollmentId, context);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }
}