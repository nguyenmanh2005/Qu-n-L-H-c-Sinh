using StudentManagement.DTOs;

namespace StudentManagement.Services.Interfaces;

public interface ITeacherService
{
    // Profile
    Task<TeacherProfileDto?> GetProfileAsync(string userId);

    // Lớp học
    Task<List<TeacherClassDto>> GetClassesAsync(string userId);
    Task<ClassStudentListDto>   GetStudentsInClassAsync(string userId, int classId);
    Task UpdateClassAsync(string userId, int classId, UpdateClassDto dto);

    // Enrollment
    Task ApproveEnrollmentAsync(string userId, int enrollmentId);
    Task RejectEnrollmentAsync(string userId, int enrollmentId);

    // Điểm danh
    Task<List<TeacherAttendanceRecordDto>> GetAttendanceAsync(string userId, int classId, DateTime? date);
    Task SaveAttendanceAsync(string userId, int classId, SaveAttendanceDto dto);

    // Restore requests
    Task<List<RestoreRequestDto>> GetRestoreRequestsAsync(string userId);
    Task ApproveRestoreRequestAsync(string userId, int requestId);
    Task RejectRestoreRequestAsync(string userId, int requestId);
    Task ApproveRestoreBulkAsync(string userId, BulkRequestActionDto dto);
    Task RejectRestoreBulkAsync(string userId, BulkRequestActionDto dto);
    Task ApproveRestoreByStudentDateAsync(string userId, ApproveByStudentDateDto dto);
}