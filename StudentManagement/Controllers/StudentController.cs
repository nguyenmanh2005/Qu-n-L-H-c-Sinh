using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentManagement.DTOs;
using StudentManagement.Services.Interfaces;
using System.Security.Claims;
using StudentManagement.Utils;

namespace StudentManagement.Controllers;

/// <summary>
/// API dành cho học sinh (role = Student).
/// Controller này KHÔNG chứa business logic – tất cả ủy quyền cho IStudentService.
/// </summary>
[Authorize(Roles = "Student")]
[ApiController]
[Route("api/[controller]")]
public class StudentController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    // ════════════════════════════════════════════════
    //  PROFILE
    // ════════════════════════════════════════════════

    /// <summary>Lấy thông tin cá nhân của học sinh đang đăng nhập.</summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await _studentService.GetProfileAsync(GetUserId());
        return profile is null ? NotFound("Không tìm thấy người dùng") : Ok(profile);
    }

    // ════════════════════════════════════════════════
    //  CLASSES
    // ════════════════════════════════════════════════

    /// <summary>Danh sách lớp học đang tham gia (mọi trạng thái).</summary>
    [HttpGet("classes")]
    public async Task<IActionResult> GetMyClasses()
        => Ok(await _studentService.GetMyClassesAsync(GetUserId()));

    /// <summary>Xem danh sách thành viên và giáo viên của lớp (chỉ khi đã được duyệt).</summary>
    [HttpGet("classes/{classId}/members")]
    public async Task<IActionResult> GetClassMembers(int classId)
    {
        var result = await _studentService.GetClassMembersAsync(GetUserId(), classId);
        return result is null ? Forbid() : Ok(result);
    }

    /// <summary>Gửi yêu cầu tham gia lớp bằng mã lớp.</summary>
    [HttpPost("join-request")]
    public async Task<IActionResult> JoinClass([FromBody] JoinClassRequestDto dto)
    {
        var (success, message) = await _studentService.JoinClassAsync(GetUserId(), dto);
        return success ? Ok(new { message }) : BadRequest(new { message });
    }

    // ════════════════════════════════════════════════
    //  SCHEDULE
    // ════════════════════════════════════════════════

    /// <summary>Lịch học của học sinh – chỉ trả về lớp đã được duyệt (Approved).</summary>
    [HttpGet("schedule")]
    public async Task<IActionResult> GetMySchedule()
        => Ok(await _studentService.GetMyScheduleAsync(GetUserId()));

    // ════════════════════════════════════════════════
    //  ATTENDANCE
    // ════════════════════════════════════════════════

    /// <summary>Toàn bộ lịch sử điểm danh của học sinh.</summary>
    [HttpGet("attendance")]
    public async Task<IActionResult> GetMyAttendance()
        => Ok(await _studentService.GetMyAttendanceAsync(GetUserId()));

    /// <summary>Tổng hợp chuyên cần theo từng lớp (có tỉ lệ %).</summary>
    [HttpGet("attendance/summary")]
    public async Task<IActionResult> GetAttendanceSummary()
        => Ok(await _studentService.GetAttendanceSummaryAsync(GetUserId()));

    // ════════════════════════════════════════════════
    //  RESTORE REQUESTS
    // ════════════════════════════════════════════════

    /// <summary>Gửi đơn khôi phục điểm danh theo AttendanceId.</summary>
    [HttpPost("attendance/restore-request")]
    public async Task<IActionResult> RequestRestore([FromBody] RestoreAttendanceDto dto)
    {
        var (success, message) = await _studentService.RequestRestoreAsync(GetUserId(), dto);
        return success ? Ok(new { message }) : BadRequest(new { message });
    }

    /// <summary>Gửi đơn khôi phục theo ClassId + Date (không cần AttendanceId).</summary>
    [HttpPost("attendance/restore-request-by")]
    public async Task<IActionResult> RequestRestoreByInfo([FromBody] RestoreAttendanceByInfoDto dto)
    {
        var (success, message) = await _studentService.RequestRestoreByInfoAsync(GetUserId(), dto);
        return success ? Ok(new { message }) : BadRequest(new { message });
    }

    /// <summary>Huỷ đơn khôi phục đang ở trạng thái Pending.</summary>
    [HttpPost("attendance/restore-request/{attendanceId}/cancel")]
    public async Task<IActionResult> CancelRestore(int attendanceId)
    {
        var (success, message) = await _studentService.CancelRestoreAsync(GetUserId(), attendanceId);
        return success ? Ok(new { message }) : BadRequest(new { message });
    }

    // ════════════════════════════════════════════════
    //  PRIVATE HELPER
    // ════════════════════════════════════════════════

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? throw new UnauthorizedAccessException("Không xác định được người dùng");
}   