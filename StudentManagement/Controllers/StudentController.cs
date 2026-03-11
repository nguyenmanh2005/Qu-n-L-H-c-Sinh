using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentManagement.DTOs;
using StudentManagement.Services.Interfaces;
using System.Security.Claims;

namespace StudentManagement.Controllers;

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

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? throw new UnauthorizedAccessException("Không xác định được người dùng");

    // ── Profile ──────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await _studentService.GetProfileAsync(GetUserId());
        return profile is null ? NotFound("Không tìm thấy người dùng") : Ok(profile);
    }

    // ── Classes ──────────────────────────────────────────────────

    [HttpGet("classes")]
    public async Task<IActionResult> GetMyClasses()
        => Ok(await _studentService.GetMyClassesAsync(GetUserId()));

    [HttpGet("classes/{classId}/members")]
    public async Task<IActionResult> GetClassMembers(int classId)
    {
        var result = await _studentService.GetClassMembersAsync(GetUserId(), classId);
        return result is null ? Forbid() : Ok(result);
    }

    [HttpPost("join-request")]
    public async Task<IActionResult> JoinClass([FromBody] JoinClassRequestDto dto)
    {
        var (success, message) = await _studentService.JoinClassAsync(GetUserId(), dto);
        return success ? Ok(new { message }) : BadRequest(new { message });
    }

    // ── Schedule ─────────────────────────────────────────────────

    [HttpGet("schedule")]
    public async Task<IActionResult> GetMySchedule()
        => Ok(await _studentService.GetMyScheduleAsync(GetUserId()));

    // ── Attendance ───────────────────────────────────────────────

    [HttpGet("attendance")]
    public async Task<IActionResult> GetMyAttendance()
        => Ok(await _studentService.GetMyAttendanceAsync(GetUserId()));

    [HttpGet("attendance/summary")]
    public async Task<IActionResult> GetAttendanceSummary()
        => Ok(await _studentService.GetAttendanceSummaryAsync(GetUserId()));

    // ── Restore Requests ─────────────────────────────────────────

    [HttpPost("attendance/restore-request")]
    public async Task<IActionResult> RequestRestore([FromBody] RestoreAttendanceDto dto)
    {
        var (success, message) = await _studentService.RequestRestoreAsync(GetUserId(), dto);
        return success ? Ok(new { message }) : BadRequest(new { message });
    }

    [HttpPost("attendance/restore-request-by")]
    public async Task<IActionResult> RequestRestoreByInfo([FromBody] RestoreAttendanceByInfoDto dto)
    {
        var (success, message) = await _studentService.RequestRestoreByInfoAsync(GetUserId(), dto);
        return success ? Ok(new { message }) : BadRequest(new { message });
    }

    [HttpPost("attendance/restore-request/{attendanceId}/cancel")]
    public async Task<IActionResult> CancelRestore(int attendanceId)
    {
        var (success, message) = await _studentService.CancelRestoreAsync(GetUserId(), attendanceId);
        return success ? Ok(new { message }) : BadRequest(new { message });
    }
}