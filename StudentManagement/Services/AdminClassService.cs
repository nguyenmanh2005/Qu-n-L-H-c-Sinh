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

// Lưu 3 thứ vừa nhận vào field private của class để các method bên dưới dùng được.
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
        // tạo danh sách rỗng để chứa thông tin lớp + tên giáo viên
        var result = new List<ClassDto>();
        // lặp qua từng phần tử lớp, mỗi c là 1 class entity, in class danh sách lấy từ DB
        foreach (var c in classes)
        {
            // ? có thể null 
            string? teacherName = null;


            if (!string.IsNullOrEmpty(c.TeacherId))
            {
                // lấy thông tin từ giáo viên
                var teacher = await _userRepository.FindByIdAsync(c.TeacherId);
                teacherName = teacher?.FullName;
            }

            // Tạo một ClassDto mới với thông tin lớp và tên giáo viên, rồi thêm vào kết quả trả về
            // .c copy từng field từ entity class vào DTO class
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
        // tìm lớp trong ĐB 
        // return fail nếu không tìm thấy, thoát ra luôn 
        var cls = await _classRepository.GetByIdAsync(classId);
        if (cls == null) return OperationResult.Fail("Không tìm thấy lớp");

        // repo gọi repo để xử lý 
        var hasEnroll = await _enrollmentRepository.FindAsync(e => e.ClassId == classId); // WHERE ClassId = @classId
        // any = true trả về fail không xóa được và ngược lại
        if (hasEnroll.Any())
            return OperationResult.Fail("Không thể xóa lớp vì đang có sinh viên tham gia. Xóa enrollments trước.");

        // đánh dấu xóa lớp
        // không gửi sql xuống đb ngay mà chỉ đánh dấu xóa, khi nào savechanges thì mới thực sự xóa
        _classRepository.Delete(cls);
        // chờ ef core thực hiện xóa lớp trong db
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

        // gán giáo viên cho lớp, gọi repo để cập nhật lớp
        cls.TeacherId = dto.TeacherId;
        _classRepository.Update(cls);

        await _classRepository.SaveChangesAsync();

        return OperationResult.Ok("Đã gán giáo viên cho lớp");
    }

    public async Task<OperationResult> UpdateScheduleAsync(int classId, UpdateScheduleDto dto, AppDbContext context)
    {

        var cls = await _classRepository.GetByIdAsync(classId);
        if (cls == null) return OperationResult.Fail("Không tìm thấy lớp");

        // cls = tờ giấy ghi thông tin lớp (lấy từ DB)
        // dto = tờ giấy ghi thông tin mới (FE gửi lên)
        cls.Schedule = dto.Schedule; //→ xóa chữ cũ trên tờ cls → chép chữ từ tờ dto vào
        cls.StartDate = dto.StartDate; 

        _classRepository.Update(cls);

        await _classRepository.SaveChangesAsync();

        return OperationResult.Ok("Cập nhật lịch lớp thành công");
    }

    public async Task<ClassStudentsDto> GetStudentsInClassAsync(int classId, AppDbContext context)
    {   

        var cls = await _classRepository.GetByIdAsync(classId);
        if (cls == null) throw new Exception("Không tìm thấy lớp");

        // lấy danh sách enrollments của lớp này
        var enrollments = await _enrollmentRepository.FindAsync(e => e.ClassId == classId);
        // 
        var students = new List<StudentEnrollmentDto>(); // tạo một danh sách rỗng để chứa thông tin sinh viên + enrollment
        foreach (var e in enrollments) // lặp qua từng enrollment, mỗi e là một enrollment entity, in danh sách lấy từ DB
        {
            // lấy thông tin sinh viên từ bảng user dựa vào e.StudentId
            var student = await _userRepository.FindByIdAsync(e.StudentId);
            students.Add(new StudentEnrollmentDto
            {
                EnrollmentId = e.Id,
                StudentId = e.StudentId,
                StudentName = student?.FullName ?? student?.UserName ?? "Không rõ", // nếu có tên đầy đủ thì dùng, không có thì dùng username, vẫn không có thì ghi "Không rõ"
                Email = student?.Email,
                Status = e.Status,
                RequestDate = e.RequestDate,
                ApprovedDate = e.ApprovedDate
            });
        }

        return new ClassStudentsDto
        {
            ClassId = cls.Id,
            ClassName = cls.Name, // tên học
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