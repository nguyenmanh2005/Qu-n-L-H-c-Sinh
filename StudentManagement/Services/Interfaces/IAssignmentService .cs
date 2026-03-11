using StudentManagement.DTOs;

namespace StudentManagement.Services.Interfaces;

public interface IAssignmentService
{
    // ── Teacher ──────────────────────────────────────────────────
    Task<AssignmentDto>         CreateAsync(string teacherId, CreateAssignmentDto dto);
    Task<AssignmentDto>         UpdateAsync(string teacherId, int assignmentId, UpdateAssignmentDto dto);
    Task                        DeleteAsync(string teacherId, int assignmentId);
    Task<List<AssignmentDto>>   GetByTeacherAsync(string teacherId);
    Task<List<SubmissionDto>>   GetSubmissionsAsync(string teacherId, int assignmentId);
    Task                        GradeAsync(string teacherId, int submissionId, GradeSubmissionDto dto);

    // ── Student ──────────────────────────────────────────────────
    Task<List<AssignmentDto>>   GetForStudentAsync(string studentId);
    Task<MySubmissionDto>       SubmitAsync(string studentId, int assignmentId, string fileName, string filePath);
    Task<MySubmissionDto>       UpdateSubmissionAsync(string studentId, int submissionId, string fileName, string filePath);
    Task<List<MySubmissionDto>> GetMySubmissionsAsync(string studentId);

    // ── Admin ────────────────────────────────────────────────────
    Task<List<AssignmentDto>>   GetAllAsync();
    Task<List<SubmissionDto>>   GetAllSubmissionsAsync(int assignmentId);
    Task                        AdminGradeAsync(int submissionId, string graderId, GradeSubmissionDto dto);  // ← thêm
    Task                        AdminDeleteSubmissionAsync(int submissionId);
    Task                        AdminDeleteAssignmentAsync(int assignmentId);
}