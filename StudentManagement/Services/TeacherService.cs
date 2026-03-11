using Microsoft.AspNetCore.Identity;
using StudentManagement.Data;
using StudentManagement.DTOs;
using StudentManagement.Entities;
using StudentManagement.Repositories.Interfaces;
using StudentManagement.Services.Interfaces;

namespace StudentManagement.Services;

public class TeacherService : ITeacherService
{
    private readonly UserManager<User>  _userManager;
    private readonly ITeacherRepository _teacherRepo;
    private readonly AppDbContext       _context;

    public TeacherService(
        UserManager<User>  userManager,
        ITeacherRepository teacherRepo,
        AppDbContext       context)
    {
        _userManager = userManager;
        _teacherRepo = teacherRepo;
        _context     = context;
    }

    // ── 1. Profile ───────────────────────────────────────────────
    public async Task<TeacherProfileDto?> GetProfileAsync(string userId)
    {
        var user    = await _userManager.FindByIdAsync(userId);
        if (user == null) return null;

        var teacher = await _teacherRepo.GetByUserIdAsync(userId);
        if (teacher == null) return null;

        return new TeacherProfileDto
        {
            Id          = user.Id,
            Username    = user.UserName,
            FullName    = user.FullName,
            Email       = user.Email,
            PhoneNumber = user.PhoneNumber,
            // ClassCount  = _context.Classes.Count(c => c.TeacherId == userId)
        };
    }

    // ── 2. Danh sách lớp ────────────────────────────────────────
    public Task<List<TeacherClassDto>> GetClassesAsync(string userId)
    {
        var classes = _context.Classes
            .Where(c => c.TeacherId == userId)
            .Select(c => new TeacherClassDto
            {
                Id           = c.Id,
                Name         = c.Name,
                Code         = c.Code,
                Schedule     = c.Schedule,
                StartDate    = c.StartDate,
                StudentCount = _context.Set<Enrollment>().Count(e => e.ClassId == c.Id)
            })
            .ToList();

        return Task.FromResult(classes);
    }

    // ── 3. Học sinh trong lớp ────────────────────────────────────
    public async Task<ClassStudentListDto> GetStudentsInClassAsync(string userId, int classId)
    {
        var cls = _context.Classes.FirstOrDefault(c => c.Id == classId && c.TeacherId == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp hoặc bạn không có quyền truy cập");

        var enrollments = _context.Set<Enrollment>().Where(e => e.ClassId == classId).ToList();
        var dayStart    = DateTime.Now.Date;
        var dayEnd      = dayStart.AddDays(1);

        var students = new List<StudentInClassDto>();
        foreach (var e in enrollments)
        {
            var student = await _userManager.FindByIdAsync(e.StudentId);
            var att = _context.Set<Attendance>().FirstOrDefault(a =>
                a.StudentId == e.StudentId && a.ClassId == classId &&
                a.Date >= dayStart && a.Date < dayEnd);

            students.Add(new StudentInClassDto
            {
                EnrollmentId       = e.Id,
                StudentId          = e.StudentId,
                StudentName        = student?.FullName ?? student?.UserName ?? "Không rõ",
                Email              = student?.Email,
                Status             = e.Status.ToString(),
                RequestDate        = e.RequestDate,
                ApprovedDate       = e.ApprovedDate,
                AttendanceId       = att?.Id,
                Present            = att?.Present ?? false,
                RestoreRequested   = att?.RestoreRequested ?? false,
                RestoreStatus      = att?.RestoreStatus,
                RestoreReason      = att?.RestoreReason,
                RestoreRequestDate = att?.RequestDate
            });
        }

        return new ClassStudentListDto
        {
            ClassId   = cls.Id,
            ClassName = cls.Name,
            ClassCode = cls.Code,
            Students  = students
        };
    }

    // ── 4. Sửa thông tin lớp ────────────────────────────────────
    public async Task UpdateClassAsync(string userId, int classId, UpdateClassDto dto)
    {
        var cls = _context.Classes.FirstOrDefault(c => c.Id == classId && c.TeacherId == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp hoặc bạn không có quyền chỉnh sửa");

        bool hasChange = false;
        if (!string.IsNullOrWhiteSpace(dto.Name))     { cls.Name      = dto.Name.Trim();     hasChange = true; }
        if (!string.IsNullOrWhiteSpace(dto.Schedule)) { cls.Schedule  = dto.Schedule.Trim(); hasChange = true; }
        if (dto.StartDate.HasValue)                    { cls.StartDate = dto.StartDate;       hasChange = true; }

        if (!hasChange) throw new InvalidOperationException("Không có thông tin nào để cập nhật");

        await _context.SaveChangesAsync();
    }

    // ── 5. Duyệt enrollment ──────────────────────────────────────
    public async Task ApproveEnrollmentAsync(string userId, int enrollmentId)
    {
        var enrollment = _context.Set<Enrollment>().FirstOrDefault(e => e.Id == enrollmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy yêu cầu");

        var cls = _context.Classes.FirstOrDefault(c => c.Id == enrollment.ClassId);
        if (cls == null || cls.TeacherId != userId) throw new UnauthorizedAccessException();

        enrollment.Status       = "Approved";
        enrollment.ApprovedDate = DateTime.Now;
        await _context.SaveChangesAsync();
    }

    // ── 6. Từ chối enrollment ────────────────────────────────────
    public async Task RejectEnrollmentAsync(string userId, int enrollmentId)
    {
        var enrollment = _context.Set<Enrollment>().FirstOrDefault(e => e.Id == enrollmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy yêu cầu");

        var cls = _context.Classes.FirstOrDefault(c => c.Id == enrollment.ClassId);
        if (cls == null || cls.TeacherId != userId) throw new UnauthorizedAccessException();

        _context.Set<Enrollment>().Remove(enrollment);
        await _context.SaveChangesAsync();
    }

    // ── 7. Lấy điểm danh ────────────────────────────────────────
    public async Task<List<TeacherAttendanceRecordDto>> GetAttendanceAsync(string userId, int classId, DateTime? date)
    {
        _ = _context.Classes.FirstOrDefault(c => c.Id == classId && c.TeacherId == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp hoặc bạn không có quyền truy cập");

        var targetDate = (date ?? DateTime.Now).Date;
        var dayEnd     = targetDate.AddDays(1);

        var studentIds = _context.Set<Enrollment>()
            .Where(e => e.ClassId == classId)
            .Select(e => e.StudentId).Distinct().ToList();

        var atts = _context.Set<Attendance>()
            .Where(a => a.ClassId == classId && a.Date >= targetDate && a.Date < dayEnd)
            .ToList();

        var result = new List<TeacherAttendanceRecordDto>();
        foreach (var sid in studentIds)
        {
            var user = await _userManager.FindByIdAsync(sid);
            var att  = atts.FirstOrDefault(a => a.StudentId == sid);
            result.Add(new TeacherAttendanceRecordDto
            {
                StudentId    = sid,
                StudentName  = user?.FullName ?? user?.UserName ?? "Không rõ",
                StudentEmail = user?.Email,
                AttendanceId = att?.Id,
                Present      = att?.Present ?? false
            });
        }

        return result;
    }

    // ── 8. Lưu điểm danh ────────────────────────────────────────
    public async Task SaveAttendanceAsync(string userId, int classId, SaveAttendanceDto dto)
    {
        _ = _context.Classes.FirstOrDefault(c => c.Id == classId && c.TeacherId == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp hoặc bạn không có quyền truy cập");

        var targetDate = dto.Date.Date;
        var dayEnd     = targetDate.AddDays(1);

        foreach (var entry in dto.Entries)
        {
            var existing = _context.Set<Attendance>().FirstOrDefault(a =>
                a.ClassId   == classId &&
                a.StudentId == entry.StudentId &&
                a.Date      >= targetDate &&
                a.Date      < dayEnd);

            if (existing != null)
                existing.Present = entry.Present;
            else
                _context.Set<Attendance>().Add(new Attendance
                {
                    StudentId        = entry.StudentId,
                    ClassId          = classId,
                    Date             = targetDate,
                    Present          = entry.Present,
                    RestoreRequested = false,
                });
        }

        await _context.SaveChangesAsync();
    }

    // ── 9. Lấy restore requests ──────────────────────────────────
    public async Task<List<RestoreRequestDto>> GetRestoreRequestsAsync(string userId)
    {
        var classIds = _context.Classes.Where(c => c.TeacherId == userId).Select(c => c.Id).ToList();

        var reqs = _context.Set<Attendance>()
            .Where(a => a.RestoreRequested &&
                        a.RestoreStatus == "Pending" &&
                        a.ClassId != null &&
                        classIds.Contains(a.ClassId.Value))
            .ToList();

        var result = new List<RestoreRequestDto>();
        foreach (var r in reqs)
        {
            var student = await _userManager.FindByIdAsync(r.StudentId);
            result.Add(new RestoreRequestDto
            {
                Id            = r.Id,
                ClassId       = r.ClassId,
                Date          = r.Date,
                Present       = r.Present,
                RestoreReason = r.RestoreReason,
                RequestDate   = r.RequestDate,
                StudentId     = r.StudentId,
                StudentName   = student?.FullName ?? student?.UserName ?? "Không rõ",
                StudentEmail  = student?.Email
            });
        }

        return result;
    }

    // ── 10. Duyệt restore request ────────────────────────────────
    public async Task ApproveRestoreRequestAsync(string userId, int requestId)
    {
        var req = _context.Set<Attendance>().FirstOrDefault(a => a.Id == requestId)
            ?? throw new KeyNotFoundException("Không tìm thấy yêu cầu");

        var cls = _context.Classes.FirstOrDefault(c => c.Id == req.ClassId);
        if (cls == null || cls.TeacherId != userId) throw new UnauthorizedAccessException();

        req.RestoreStatus = "Approved";
        req.ReviewedDate  = DateTime.Now;
        req.ReviewedBy    = userId;
        req.Present       = true;
        await _context.SaveChangesAsync();
    }

    // ── 11. Từ chối restore request ──────────────────────────────
    public async Task RejectRestoreRequestAsync(string userId, int requestId)
    {
        var req = _context.Set<Attendance>().FirstOrDefault(a => a.Id == requestId)
            ?? throw new KeyNotFoundException("Không tìm thấy yêu cầu");

        var cls = _context.Classes.FirstOrDefault(c => c.Id == req.ClassId);
        if (cls == null || cls.TeacherId != userId) throw new UnauthorizedAccessException();

        req.RestoreStatus = "Rejected";
        req.ReviewedDate  = DateTime.Now;
        req.ReviewedBy    = userId;
        await _context.SaveChangesAsync();
    }

    // ── 12. Duyệt bulk ───────────────────────────────────────────
    public async Task ApproveRestoreBulkAsync(string userId, BulkRequestActionDto dto)
    {
        var classIds = _context.Classes.Where(c => c.TeacherId == userId).Select(c => c.Id).ToList();
        var reqs     = _context.Set<Attendance>().Where(a => dto.RequestIds.Contains(a.Id)).ToList();

        foreach (var r in reqs)
        {
            if (r.ClassId == null || !classIds.Contains(r.ClassId.Value)) continue;
            if (r.RestoreStatus != "Pending") continue;
            r.RestoreStatus = "Approved"; r.ReviewedDate = DateTime.Now; r.ReviewedBy = userId; r.Present = true;
        }

        await _context.SaveChangesAsync();
    }

    // ── 13. Từ chối bulk ─────────────────────────────────────────
    public async Task RejectRestoreBulkAsync(string userId, BulkRequestActionDto dto)
    {
        var classIds = _context.Classes.Where(c => c.TeacherId == userId).Select(c => c.Id).ToList();
        var reqs     = _context.Set<Attendance>().Where(a => dto.RequestIds.Contains(a.Id)).ToList();

        foreach (var r in reqs)
        {
            if (r.ClassId == null || !classIds.Contains(r.ClassId.Value)) continue;
            if (r.RestoreStatus != "Pending") continue;
            r.RestoreStatus = "Rejected"; r.ReviewedDate = DateTime.Now; r.ReviewedBy = userId;
        }

        await _context.SaveChangesAsync();
    }

    // ── 14. Duyệt theo studentId + date ─────────────────────────
    public async Task ApproveRestoreByStudentDateAsync(string userId, ApproveByStudentDateDto dto)
    {
        _ = _context.Classes.FirstOrDefault(c => c.Id == dto.ClassId && c.TeacherId == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp hoặc bạn không có quyền truy cập");

        var dayStart = dto.Date.Date;
        var att = _context.Set<Attendance>().FirstOrDefault(a =>
            a.StudentId == dto.StudentId && a.ClassId == dto.ClassId &&
            a.Date >= dayStart && a.Date < dayStart.AddDays(1));

        if (att == null) throw new KeyNotFoundException("Không tìm thấy bản ghi điểm danh");
        if (!att.RestoreRequested || att.RestoreStatus != "Pending")
            throw new InvalidOperationException("Bản ghi không có yêu cầu đang chờ");

        att.RestoreStatus = "Approved"; att.ReviewedDate = DateTime.Now; att.ReviewedBy = userId; att.Present = true;
        await _context.SaveChangesAsync();
    }
}