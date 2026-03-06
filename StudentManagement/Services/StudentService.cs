using Microsoft.AspNetCore.Identity;
using StudentManagement.Utils;
using StudentManagement.DTOs;
using StudentManagement.Entities;
using StudentManagement.Repositories.Interfaces;
using StudentManagement.Services.Interfaces;

namespace StudentManagement.Services;

public class StudentService : IStudentService
{
    private readonly IStudentRepository _repo;
    private readonly UserManager<User>  _userManager;

    public StudentService(IStudentRepository repo, UserManager<User> userManager)
    {
        _repo        = repo;
        _userManager = userManager;
    }

    // ─────────────────────────────────────────────────────────────────────
    // PROFILE
    // ─────────────────────────────────────────────────────────────────────

    public async Task<StudentProfileDto?> GetProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return null;

        return new StudentProfileDto
        {
            Id          = user.Id,
            Username    = user.UserName,
            FullName    = user.FullName,
            Email       = user.Email,
            PhoneNumber = user.PhoneNumber
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // CLASSES
    // ─────────────────────────────────────────────────────────────────────

    public async Task<List<StudentClassDto>> GetMyClassesAsync(string userId)
    {
        var enrollments = await _repo.GetEnrollmentsByStudentAsync(userId);
        var result      = new List<StudentClassDto>();

        foreach (var e in enrollments)
        {
            var cls = await _repo.GetClassByIdAsync(e.ClassId);
            if (cls is null) continue;

            var teacher = cls.TeacherId is not null
                ? await _userManager.FindByIdAsync(cls.TeacherId)
                : null;

            result.Add(new StudentClassDto
            {
                ClassId    = cls.Id,
                Name       = cls.Name,
                Code       = cls.Code,
                Schedule   = cls.Schedule,
                StartDate  = cls.StartDate,
                Teacher    = teacher?.FullName ?? teacher?.UserName ?? "Chưa có",
                Status     = e.Status,
                JoinedDate = e.ApprovedDate
            });
        }

        return result;
    }

    public async Task<ClassMembersDto?> GetClassMembersAsync(string userId, int classId)
    {
        // Chỉ cho xem nếu học sinh đã được duyệt vào lớp
        var enrollment = await _repo.GetEnrollmentAsync(userId, classId);
        if (enrollment is null || enrollment.Status != "Approved")
            return null;

        var cls = await _repo.GetClassByIdAsync(classId);
        if (cls is null) return null;

        // Thông tin giáo viên
        TeacherInfoDto? teacherInfo = null;
        if (cls.TeacherId is not null)
        {
            var teacher = await _userManager.FindByIdAsync(cls.TeacherId);
            if (teacher is not null)
                teacherInfo = new TeacherInfoDto
                {
                    UserId   = teacher.Id,
                    FullName = teacher.FullName ?? teacher.UserName ?? "—",
                    Email    = teacher.Email
                };
        }

        // Danh sách học sinh đã được duyệt
        var allEnrollments = await _repo.GetEnrollmentsByClassAsync(classId);
        var members        = new List<MemberDto>();

        foreach (var e in allEnrollments.Where(e => e.Status == "Approved"))
        {
            var student = await _userManager.FindByIdAsync(e.StudentId);
            if (student is null) continue;

            members.Add(new MemberDto
            {
                UserId   = student.Id,
                FullName = student.FullName ?? student.UserName ?? "—",
                Email    = student.Email,
                Status   = e.Status
            });
        }

        return new ClassMembersDto
        {
            ClassId   = cls.Id,
            ClassName = cls.Name,
            ClassCode = cls.Code,
            Schedule  = cls.Schedule,
            Teacher   = teacherInfo,
            Members   = members
        };
    }

    public async Task<(bool Success, string Message)> JoinClassAsync(
        string userId, JoinClassRequestDto dto)
    {
        var cls = await _repo.GetClassByCodeAsync(dto.ClassCode);
        if (cls is null)
            return (false, $"Không tìm thấy lớp với mã '{dto.ClassCode}'");

        var existing = await _repo.GetEnrollmentAsync(userId, cls.Id);
        if (existing is not null)
            return (false, "Bạn đã gửi yêu cầu hoặc đã tham gia lớp này rồi");

        var enrollment = new Enrollment
        {
            StudentId   = userId,
            ClassId     = cls.Id,
            Status      = "Pending",
            RequestDate = DateTime.Now
        };

        await _repo.AddEnrollmentAsync(enrollment);
        await _repo.SaveChangesAsync();

        return (true, $"Đã gửi yêu cầu tham gia lớp '{cls.Name}'. Chờ giáo viên duyệt!");
    }

    // ─────────────────────────────────────────────────────────────────────
    // SCHEDULE
    // ─────────────────────────────────────────────────────────────────────

    public async Task<List<StudentScheduleDto>> GetMyScheduleAsync(string userId)
    {
        var enrollments = await _repo.GetEnrollmentsByStudentAsync(userId);
        var result      = new List<StudentScheduleDto>();

        foreach (var e in enrollments.Where(e => e.Status == "Chấp Nhận" || e.Status == "Approved"))
        {
            var cls = await _repo.GetClassByIdAsync(e.ClassId);
            if (cls is null) continue;

            var teacher = cls.TeacherId is not null
                ? await _userManager.FindByIdAsync(cls.TeacherId)
                : null;

            result.Add(new StudentScheduleDto
            {
                ClassId     = cls.Id,
                ClassName   = cls.Name,
                ClassCode   = cls.Code,
                ScheduleRaw = cls.Schedule,
                StartDate   = cls.StartDate,
                TeacherName = teacher?.FullName ?? teacher?.UserName ?? "Chưa có",
                Slots       = ScheduleParser.ParseSlots(cls.Schedule)
            });
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────
    // ATTENDANCE
    // ─────────────────────────────────────────────────────────────────────

    public async Task<List<AttendanceRecordDto>> GetMyAttendanceAsync(string userId)
    {
        var records = await _repo.GetAttendanceByStudentAsync(userId);

        return records.Select(a => new AttendanceRecordDto
        {
            Id               = a.Id,
            ClassId          = a.ClassId,
            Date             = a.Date,
            Present          = a.Present,
            RestoreRequested = a.RestoreRequested,
            RestoreStatus    = a.RestoreStatus,
            RestoreReason    = a.RestoreReason,
            RequestDate      = a.RequestDate,
            ReviewedDate     = a.ReviewedDate
        }).ToList();
    }

    public async Task<List<AttendanceSummaryDto>> GetAttendanceSummaryAsync(string userId)
    {
        var enrollments = await _repo.GetEnrollmentsByStudentAsync(userId);
        var allAtt      = await _repo.GetAttendanceByStudentAsync(userId);
        var result      = new List<AttendanceSummaryDto>();

        foreach (var e in enrollments.Where(e => e.Status == "Approved"))
        {
            var cls = await _repo.GetClassByIdAsync(e.ClassId);
            if (cls is null) continue;

            var clsAtt  = allAtt.Where(a => a.ClassId == e.ClassId).ToList();
            var present = clsAtt.Count(a => a.Present == true);
            var total   = clsAtt.Count;
            var absents = clsAtt.Where(a => a.Present != true).ToList();

            result.Add(new AttendanceSummaryDto
            {
                ClassId         = cls.Id,
                ClassName       = cls.Name,
                ClassCode       = cls.Code,
                Present         = present,
                Absent          = total - present,
                Total           = total,
                PendingRestore  = absents.Count(a => a.RestoreRequested && a.RestoreStatus == "Pending"),
                ApprovedRestore = absents.Count(a => a.RestoreStatus == "Approved"),
                AttendanceRate  = total > 0 ? Math.Round((double)present / total * 100, 1) : 0
            });
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────
    // RESTORE REQUESTS
    // ─────────────────────────────────────────────────────────────────────

    public async Task<(bool Success, string Message)> RequestRestoreAsync(
        string userId, RestoreAttendanceDto dto)
    {
        var att = await _repo.GetAttendanceByIdAsync(dto.AttendanceId, userId);
        if (att is null)
            return (false, "Không tìm thấy bản ghi điểm danh");
        if (att.Present == true)
            return (false, "Bạn đã có mặt trong buổi này, không cần khôi phục");
        if (att.RestoreRequested && att.RestoreStatus == "Pending")
            return (false, "Đã có đơn khôi phục đang chờ xử lý");

        att.RestoreRequested = true;
        att.RestoreReason    = dto.Reason;
        att.RestoreStatus    = "Pending";
        att.RequestDate      = DateTime.Now;

        await _repo.SaveChangesAsync();
        return (true, "Đã gửi yêu cầu khôi phục điểm danh");
    }

    public async Task<(bool Success, string Message)> RequestRestoreByInfoAsync(
        string userId, RestoreAttendanceByInfoDto dto)
    {
        var att = await _repo.GetAttendanceByDateAsync(userId, dto.ClassId, dto.Date);

        if (att is null)
        {
            att = new Attendance
            {
                StudentId        = userId,
                ClassId          = dto.ClassId,
                Date             = dto.Date.Date,
                Present          = false,
                RestoreRequested = true,
                RestoreReason    = dto.Reason,
                RestoreStatus    = "Pending",
                RequestDate      = DateTime.Now
            };
            await _repo.AddAttendanceAsync(att);
        }
        else
        {
            if (att.RestoreRequested && att.RestoreStatus == "Pending")
                return (false, "Đã có đơn khôi phục đang chờ xử lý");

            att.RestoreRequested = true;
            att.RestoreReason    = dto.Reason;
            att.RestoreStatus    = "Pending";
            att.RequestDate      = DateTime.Now;
        }

        await _repo.SaveChangesAsync();
        return (true, "Đã gửi yêu cầu khôi phục điểm danh");
    }

    public async Task<(bool Success, string Message)> CancelRestoreAsync(
        string userId, int attendanceId)
    {
        var att = await _repo.GetAttendanceByIdAsync(attendanceId, userId);
        if (att is null)
            return (false, "Không tìm thấy bản ghi điểm danh");
        if (!att.RestoreRequested)
            return (false, "Không có yêu cầu đang chờ");
        if (att.RestoreStatus == "Approved")
            return (false, "Yêu cầu đã được duyệt, không thể huỷ");

        att.RestoreRequested = false;
        att.RestoreStatus    = null;
        att.RestoreReason    = null;
        att.RequestDate      = null;

        await _repo.SaveChangesAsync();
        return (true, "Đã huỷ yêu cầu khôi phục");
    }
}