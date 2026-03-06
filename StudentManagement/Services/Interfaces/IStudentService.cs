using StudentManagement.DTOs;

namespace StudentManagement.Services.Interfaces;

/// <summary>
/// Business logic liên quan đến học sinh.
/// Controller chỉ gọi interface này, không chứa logic.
/// </summary>
public interface IStudentService
{
    // ── Profile ─────────────────────────────────────────────────────────
    Task<StudentProfileDto?> GetProfileAsync(string userId);

    // ── Classes ──────────────────────────────────────────────────────────
    Task<List<StudentClassDto>>  GetMyClassesAsync(string userId);
    Task<ClassMembersDto?>       GetClassMembersAsync(string userId, int classId); // ← thêm mới
    Task<(bool Success, string Message)> JoinClassAsync(string userId, JoinClassRequestDto dto);

    // ── Schedule ─────────────────────────────────────────────────────────
    Task<List<StudentScheduleDto>> GetMyScheduleAsync(string userId);

    // ── Attendance ───────────────────────────────────────────────────────
    Task<List<AttendanceRecordDto>>  GetMyAttendanceAsync(string userId);
    Task<List<AttendanceSummaryDto>> GetAttendanceSummaryAsync(string userId);

    // ── Restore requests ─────────────────────────────────────────────────
    Task<(bool Success, string Message)> RequestRestoreAsync(string userId, RestoreAttendanceDto dto);
    Task<(bool Success, string Message)> RequestRestoreByInfoAsync(string userId, RestoreAttendanceByInfoDto dto);
    Task<(bool Success, string Message)> CancelRestoreAsync(string userId, int attendanceId);
}