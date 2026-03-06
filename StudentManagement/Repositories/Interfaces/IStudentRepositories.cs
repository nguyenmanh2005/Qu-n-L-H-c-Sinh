using StudentManagement.Entities;

namespace StudentManagement.Repositories.Interfaces;

/// <summary>
/// Tất cả thao tác đọc/ghi dữ liệu liên quan đến học sinh.
/// Controller và Service KHÔNG được dùng DbContext trực tiếp – chỉ qua interface này.
/// </summary>
public interface IStudentRepository
{
    // ── Enrollment ──────────────────────────────────────────────────────
    Task<List<Enrollment>> GetEnrollmentsByStudentAsync(string studentId);
    Task<List<Enrollment>> GetEnrollmentsByClassAsync(int classId);       // ← thêm mới
    Task<Enrollment?>      GetEnrollmentAsync(string studentId, int classId);
    Task                   AddEnrollmentAsync(Enrollment enrollment);

    // ── Class ───────────────────────────────────────────────────────────
    Task<Class?> GetClassByIdAsync(int classId);
    Task<Class?> GetClassByCodeAsync(string code);

    // ── Attendance ──────────────────────────────────────────────────────
    Task<List<Attendance>> GetAttendanceByStudentAsync(string studentId);
    Task<List<Attendance>> GetAttendanceByStudentAndMonthAsync(string studentId, int year, int month);
    Task<Attendance?>      GetAttendanceByIdAsync(int id, string studentId);
    Task<Attendance?>      GetAttendanceByDateAsync(string studentId, int classId, DateTime date);
    Task                   AddAttendanceAsync(Attendance attendance);

    Task SaveChangesAsync();
}