using StudentManagement.Entities;
using StudentManagement.Data;
using StudentManagement.DTOs;
using StudentManagement.Services;

namespace StudentManagement.Services.Interfaces;

public interface IAdminClassService
{
    Task<List<ClassDto>> GetAllClassesAsync();
    Task<OperationResult<Class>> CreateClassAsync(CreateClassAdminDto dto, AppDbContext context);
    Task<OperationResult> DeleteClassAsync(int classId, AppDbContext context);
    Task<OperationResult> AssignTeacherAsync(int classId, AssignTeacherDto dto, AppDbContext context);
    Task<OperationResult> UpdateScheduleAsync(int classId, UpdateScheduleDto dto, AppDbContext context);
    Task<ClassStudentsDto> GetStudentsInClassAsync(int classId, AppDbContext context);
    Task<OperationResult> RemoveEnrollmentAsync(int enrollmentId, AppDbContext context);
}