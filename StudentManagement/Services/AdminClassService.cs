using Microsoft.EntityFrameworkCore;
using StudentManagement.Entities;
using StudentManagement.Services.Interfaces;
using StudentManagement.Repositories.Interfaces;
using StudentManagement.Data;
using StudentManagement.DTOs;

namespace StudentManagement.Services;

public class AdminClassService : IAdminClassService
{
    private readonly IClassRepository _classRepository;
    private readonly IEnrollmentRepository _enrollmentRepository;
    private readonly IUserRepository _userRepository;

    public AdminClassService(
        IClassRepository classRepository,
        IEnrollmentRepository enrollmentRepository,
        IUserRepository userRepository)
    {
        _classRepository = classRepository;
        _enrollmentRepository = enrollmentRepository;
        _userRepository = userRepository;
    }

    public async Task<List<ClassDto>> GetAllClassesAsync()
    {
        var classes = await _classRepository.GetAllAsync();
        var result = new List<ClassDto>();

        foreach (var c in classes)
        {
            string? teacherName = null;
            if (!string.IsNullOrEmpty(c.TeacherId))
            {
                var teacher = await _userRepository.FindByIdAsync(c.TeacherId);
                teacherName = teacher?.FullName;
            }

            result.Add(new ClassDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Schedule = c.Schedule,
                StartDate = c.StartDate,
                TeacherId = c.TeacherId,
                TeacherName = teacherName
            });
        }

        return result;
    }

    public async Task<OperationResult<Class>> CreateClassAsync(CreateClassAdminDto dto, AppDbContext context)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Code))
            return OperationResult<Class>.Fail("Tên lớp và mã lớp là bắt buộc");

        var existing = await _classRepository.GetByCodeAsync(dto.Code.ToUpper());
        if (existing != null)
            return OperationResult<Class>.Fail($"Mã lớp '{dto.Code}' đã tồn tại");

        var cls = new Class
        {
            Name = dto.Name.Trim(),
            Code = dto.Code.Trim().ToUpper(),
            Schedule = dto.Schedule?.Trim(),
            StartDate = dto.StartDate,
            TeacherId = dto.TeacherId
        };

        await _classRepository.AddAsync(cls);
        await _classRepository.SaveChangesAsync();

        return OperationResult<Class>.Ok("Đã tạo lớp", cls);
    }

    public async Task<OperationResult> DeleteClassAsync(int classId, AppDbContext context)
    {
        var cls = await _classRepository.GetByIdAsync(classId);
        if (cls == null) return OperationResult.Fail("Không tìm thấy lớp");

        var hasEnroll = await _enrollmentRepository.FindAsync(e => e.ClassId == classId);
        if (hasEnroll.Any())
            return OperationResult.Fail("Không thể xóa lớp vì đang có sinh viên tham gia. Xóa enrollments trước.");

        _classRepository.Delete(cls);
        await _classRepository.SaveChangesAsync();

        return OperationResult.Ok("Đã xóa lớp");
    }

    public async Task<OperationResult> AssignTeacherAsync(int classId, AssignTeacherDto dto, AppDbContext context)
    {
        var cls = await _classRepository.GetByIdAsync(classId);
        if (cls == null) return OperationResult.Fail("Không tìm thấy lớp");

        var teacher = await _userRepository.FindByIdAsync(dto.TeacherId);
        if (teacher == null) return OperationResult.Fail("Không tìm thấy giáo viên");

        var roles = await _userRepository.GetRolesAsync(teacher);
        if (!roles.Contains("Teacher")) return OperationResult.Fail("Người được chọn không phải là giáo viên");

        cls.TeacherId = dto.TeacherId;
        _classRepository.Update(cls);
        await _classRepository.SaveChangesAsync();

        return OperationResult.Ok("Đã gán giáo viên cho lớp");
    }

    public async Task<OperationResult> UpdateScheduleAsync(int classId, UpdateScheduleDto dto, AppDbContext context)
    {
        var cls = await _classRepository.GetByIdAsync(classId);
        if (cls == null) return OperationResult.Fail("Không tìm thấy lớp");

        cls.Schedule = dto.Schedule;
        cls.StartDate = dto.StartDate;
        _classRepository.Update(cls);
        await _classRepository.SaveChangesAsync();

        return OperationResult.Ok("Cập nhật lịch lớp thành công");
    }

    public async Task<ClassStudentsDto> GetStudentsInClassAsync(int classId, AppDbContext context)
    {
        var cls = await _classRepository.GetByIdAsync(classId);
        if (cls == null) throw new Exception("Không tìm thấy lớp");

        var enrollments = await _enrollmentRepository.FindAsync(e => e.ClassId == classId);

        var students = new List<StudentEnrollmentDto>();
        foreach (var e in enrollments)
        {
            var student = await _userRepository.FindByIdAsync(e.StudentId);
            students.Add(new StudentEnrollmentDto
            {
                EnrollmentId = e.Id,
                StudentId = e.StudentId,
                StudentName = student?.FullName ?? student?.UserName ?? "Không rõ",
                Email = student?.Email,
                Status = e.Status,
                RequestDate = e.RequestDate,
                ApprovedDate = e.ApprovedDate
            });
        }

        return new ClassStudentsDto
        {
            ClassId = cls.Id,
            ClassName = cls.Name,
            Students = students
        };
    }

    public async Task<OperationResult> RemoveEnrollmentAsync(int enrollmentId, AppDbContext context)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        if (enrollment == null) return OperationResult.Fail("Không tìm thấy enrollment");

        _enrollmentRepository.Delete(enrollment);
        await _enrollmentRepository.SaveChangesAsync();

        return OperationResult.Ok("Đã xóa sinh viên khỏi lớp");
    }
}