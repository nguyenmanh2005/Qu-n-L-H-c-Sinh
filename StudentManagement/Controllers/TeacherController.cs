using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentManagement.DTOs;
using StudentManagement.Services.Interfaces;
using System.Security.Claims;

namespace StudentManagement.Controllers;

[Authorize(Roles = "Teacher")]
[Route("api/[controller]")]
[ApiController]
public class TeacherController : ControllerBase
{
    private readonly ITeacherService _teacherService;

    public TeacherController(ITeacherService teacherService)
    {
        _teacherService = teacherService;
    }

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // ── Profile ──────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var profile = await _teacherService.GetProfileAsync(userId);
            return profile == null ? NotFound("Không tìm thấy") : Ok(profile);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message,
                inner   = ex.InnerException?.Message,
                stack   = ex.StackTrace
            });
        }
    }

    // ── Lớp học ──────────────────────────────────────────────────

    [HttpGet("classes")]
    public async Task<IActionResult> GetClasses()
    {
        try
        {
            var classes = await _teacherService.GetClassesAsync(UserId());
            return Ok(classes);
        }
        catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
    }

    [HttpGet("classes/{classId}/students")]
    public async Task<IActionResult> GetStudentsInClass(int classId)
    {
        try
        {
            var result = await _teacherService.GetStudentsInClassAsync(UserId(), classId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpPut("classes/{classId}")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> UpdateClass(int classId, [FromBody] UpdateClassDto dto)
    {
        try
        {
            await _teacherService.UpdateClassAsync(UserId(), classId, dto);
            return Ok(new { message = "Cập nhật lớp thành công" });
        }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    // ── Enrollment ───────────────────────────────────────────────

    [HttpPost("enrollments/{enrollmentId}/approve")]
    public async Task<IActionResult> ApproveEnrollment(int enrollmentId)
    {
        try
        {
            await _teacherService.ApproveEnrollmentAsync(UserId(), enrollmentId);
            return Ok(new { message = "Đã duyệt học sinh vào lớp" });
        }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpPost("enrollments/{enrollmentId}/reject")]
    public async Task<IActionResult> RejectEnrollment(int enrollmentId)
    {
        try
        {
            await _teacherService.RejectEnrollmentAsync(UserId(), enrollmentId);
            return Ok(new { message = "Đã từ chối yêu cầu và xoá khỏi danh sách" });
        }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpGet("pending-requests")]
    public IActionResult GetPendingRequests() => Ok(new List<object>());

    // ── Điểm danh ────────────────────────────────────────────────

    [HttpGet("classes/{classId}/attendance")]
    public async Task<IActionResult> GetAttendance(int classId, [FromQuery] DateTime? date)
    {
        try
        {
            var result = await _teacherService.GetAttendanceAsync(UserId(), classId, date);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpPost("classes/{classId}/attendance")]
    public async Task<IActionResult> SaveAttendance(int classId, [FromBody] SaveAttendanceDto dto)
    {
        try
        {
            await _teacherService.SaveAttendanceAsync(UserId(), classId, dto);
            return Ok(new { message = "Đã lưu điểm danh" });
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    // ── Restore requests ─────────────────────────────────────────

    [HttpGet("attendance/restore-requests")]
    public async Task<IActionResult> GetRestoreRequests()
    {
        var result = await _teacherService.GetRestoreRequestsAsync(UserId());
        return Ok(result);
    }

    [HttpPost("attendance/requests/{requestId}/approve")]
    public async Task<IActionResult> ApproveRestoreRequest(int requestId)
    {
        try
        {
            await _teacherService.ApproveRestoreRequestAsync(UserId(), requestId);
            return Ok(new { message = "Đã duyệt yêu cầu khôi phục" });
        }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpPost("attendance/requests/{requestId}/reject")]
    public async Task<IActionResult> RejectRestoreRequest(int requestId)
    {
        try
        {
            await _teacherService.RejectRestoreRequestAsync(UserId(), requestId);
            return Ok(new { message = "Đã từ chối yêu cầu khôi phục" });
        }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpPost("attendance/requests/approve-bulk")]
    public async Task<IActionResult> ApproveRestoreRequestsBulk([FromBody] BulkRequestActionDto dto)
    {
        await _teacherService.ApproveRestoreBulkAsync(UserId(), dto);
        return Ok(new { message = "Đã xử lý yêu cầu" });
    }

    [HttpPost("attendance/requests/reject-bulk")]
    public async Task<IActionResult> RejectRestoreRequestsBulk([FromBody] BulkRequestActionDto dto)
    {
        await _teacherService.RejectRestoreBulkAsync(UserId(), dto);
        return Ok(new { message = "Đã xử lý yêu cầu" });
    }

    [HttpPost("attendance/requests/approve-by")]
    public async Task<IActionResult> ApproveRestoreByStudentDate([FromBody] ApproveByStudentDateDto dto)
    {
        try
        {
            await _teacherService.ApproveRestoreByStudentDateAsync(UserId(), dto);
            return Ok(new { message = "Đã duyệt yêu cầu khôi phục" });
        }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }
}