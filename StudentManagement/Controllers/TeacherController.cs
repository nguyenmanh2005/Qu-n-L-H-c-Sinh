using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudentManagement.Data;
using StudentManagement.Entities;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Controllers
{
    [Authorize(Roles = "Teacher")]
    [Route("api/[controller]")]
    [ApiController]
    public class TeacherController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly AppDbContext _context;

        public TeacherController(UserManager<User> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound("Không tìm thấy người dùng");

            var classCount = _context.Classes.Count(c => c.TeacherId == userId);

            return Ok(new
            {
                id          = user.Id,
                username    = user.UserName,
                fullName    = user.FullName,
                email       = user.Email,
                phoneNumber = user.PhoneNumber,
                classCount
            });
        }

        [HttpGet("classes")]
        public IActionResult GetClasses()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var classes = _context.Classes
                    .Where(c => c.TeacherId == userId)
                    .Select(c => new
                    {
                        id           = c.Id,
                        name         = c.Name,
                        code         = c.Code,
                        schedule     = c.Schedule,
                        startDate    = c.StartDate,
                        studentCount = _context.Set<Enrollment>().Count(e => e.ClassId == c.Id)
                    })
                    .ToList();

                return Ok(classes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        // ===== XEM DANH SÁCH HỌC SINH TRONG LỚP =====
        [HttpGet("classes/{classId}/students")]
        public async Task<IActionResult> GetStudentsInClass(int classId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Kiểm tra lớp có thuộc về teacher này không
            var cls = _context.Classes.FirstOrDefault(c => c.Id == classId && c.TeacherId == userId);
            if (cls == null)
                return NotFound("Không tìm thấy lớp hoặc bạn không có quyền truy cập");

            var enrollments = _context.Set<Enrollment>()
                .Where(e => e.ClassId == classId)
                .ToList();

            var result = new List<object>();
            foreach (var e in enrollments)
            {
                var student = await _userManager.FindByIdAsync(e.StudentId);
                // load today's attendance for easier marking and restore handling
                var dayStart = DateTime.Now.Date;
                var dayEnd = dayStart.AddDays(1);
                var att = _context.Set<Attendance>().FirstOrDefault(a => a.StudentId == e.StudentId && a.ClassId == classId && a.Date >= dayStart && a.Date < dayEnd);

                result.Add(new
                {
                    enrollmentId = e.Id,
                    studentId    = e.StudentId,
                    studentName  = student?.FullName ?? student?.UserName ?? "Không rõ",
                    email        = student?.Email,
                    status       = e.Status.ToString(),
                    requestDate  = e.RequestDate,
                    approvedDate = e.ApprovedDate,

                    // attendance for today
                    attendanceId = att?.Id,
                    present = att?.Present ?? false,
                    restoreRequested = att?.RestoreRequested ?? false,
                    restoreStatus = att?.RestoreStatus,
                    restoreReason = att?.RestoreReason,
                    restoreRequestDate = att?.RequestDate
                });
            }

            return Ok(new
            {
                classId   = cls.Id,
                className = cls.Name,
                classCode = cls.Code,
                students  = result
            });
        }

        // ===== DUYỆT / TỪ CHỐI YÊU CẦU =====
        [HttpPost("enrollments/{enrollmentId}/approve")]
        public async Task<IActionResult> ApproveEnrollment(int enrollmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var enrollment = _context.Set<Enrollment>().FirstOrDefault(e => e.Id == enrollmentId);
            if (enrollment == null) return NotFound("Không tìm thấy yêu cầu");

            var cls = _context.Classes.FirstOrDefault(c => c.Id == enrollment.ClassId);
            if (cls == null || cls.TeacherId != userId)
                return Forbid();

            enrollment.Status = "Approved";
            enrollment.ApprovedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã duyệt học sinh vào lớp" });
        }

        [HttpPost("enrollments/{enrollmentId}/reject")]
        public async Task<IActionResult> RejectEnrollment(int enrollmentId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var enrollment = _context.Set<Enrollment>().FirstOrDefault(e => e.Id == enrollmentId);
            if (enrollment == null) return NotFound("Không tìm thấy yêu cầu");

            var cls = _context.Classes.FirstOrDefault(c => c.Id == enrollment.ClassId);
            if (cls == null || cls.TeacherId != userId)
                return Forbid();

            // Xoá bản ghi enrollment khi từ chối để học sinh có thể gửi lại yêu cầu
            _context.Set<Enrollment>().Remove(enrollment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã từ chối yêu cầu và xoá khỏi danh sách" });
        }

        // ===== SỬA THÔNG TIN LỚP =====
        [HttpPut("classes/{classId}")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UpdateClass(int classId, [FromBody] UpdateClassDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var cls = _context.Classes.FirstOrDefault(c => c.Id == classId && c.TeacherId == userId);
            if (cls == null)
                return NotFound("Không tìm thấy lớp hoặc bạn không có quyền chỉnh sửa");

            bool hasChange = false;

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                cls.Name = dto.Name.Trim();
                hasChange = true;
            }

            if (!string.IsNullOrWhiteSpace(dto.Schedule))
            {
                cls.Schedule = dto.Schedule.Trim();
                hasChange = true;
            }

            if (dto.StartDate.HasValue)
            {
                cls.StartDate = dto.StartDate;
                hasChange = true;
            }

            if (!hasChange)
                return BadRequest(new { message = "Không có thông tin nào để cập nhật" });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message      = "Cập nhật lớp thành công",
                cls.Id,
                cls.Name,
                cls.Code,
                cls.Schedule,
                cls.StartDate
            });
        }

        [HttpGet("pending-requests")]
        public IActionResult GetPendingRequests()
        {
            return Ok(new List<object>());
        }

        // ===== YÊU CẦU KHÔI PHỤC ĐIỂM DANH (Teacher xử lý) =====
        [HttpGet("attendance/restore-requests")]
        public async Task<IActionResult> GetRestoreRequests()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var classIds = _context.Classes.Where(c => c.TeacherId == userId).Select(c => c.Id).ToList();

            var reqs = _context.Set<Attendance>()
                .Where(a => a.RestoreRequested && a.RestoreStatus == "Pending" && a.ClassId != null && classIds.Contains(a.ClassId.Value))
                .ToList();

            var result = new List<object>();
            foreach (var r in reqs)
            {
                var student = await _userManager.FindByIdAsync(r.StudentId);
                result.Add(new
                {
                    r.Id,
                    r.ClassId,
                    r.Date,
                    r.Present,
                    r.RestoreReason,
                    r.RequestDate,
                    studentId = r.StudentId,
                    studentName = student?.FullName ?? student?.UserName ?? "Không rõ",
                    studentEmail = student?.Email
                });
            }

            return Ok(result);
        }

        [HttpPost("attendance/requests/{requestId}/approve")]
        public async Task<IActionResult> ApproveRestoreRequest(int requestId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var req = _context.Set<Attendance>().FirstOrDefault(a => a.Id == requestId);
            if (req == null) return NotFound("Không tìm thấy yêu cầu");

            var cls = _context.Classes.FirstOrDefault(c => c.Id == req.ClassId);
            if (cls == null || cls.TeacherId != userId) return Forbid();

            req.RestoreStatus = "Approved";
            req.ReviewedDate = DateTime.Now;
            req.ReviewedBy = userId;
            req.Present = true; // restore
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã duyệt yêu cầu khôi phục" });
        }

        [HttpPost("attendance/requests/approve-bulk")]
        public async Task<IActionResult> ApproveRestoreRequestsBulk([FromBody] BulkRequestActionDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var classIds = _context.Classes.Where(c => c.TeacherId == userId).Select(c => c.Id).ToList();

            var reqs = _context.Set<Attendance>().Where(a => dto.RequestIds.Contains(a.Id)).ToList();
            var updated = 0;
            foreach (var r in reqs)
            {
                if (r.ClassId == null || !classIds.Contains(r.ClassId.Value)) continue;
                if (r.RestoreStatus == "Pending")
                {
                    r.RestoreStatus = "Approved";
                    r.ReviewedDate = DateTime.Now;
                    r.ReviewedBy = userId;
                    r.Present = true;
                    updated++;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xử lý yêu cầu", updated });
        }

        [HttpPost("attendance/requests/reject-bulk")]
        public async Task<IActionResult> RejectRestoreRequestsBulk([FromBody] BulkRequestActionDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var classIds = _context.Classes.Where(c => c.TeacherId == userId).Select(c => c.Id).ToList();

            var reqs = _context.Set<Attendance>().Where(a => dto.RequestIds.Contains(a.Id)).ToList();
            var updated = 0;
            foreach (var r in reqs)
            {
                if (r.ClassId == null || !classIds.Contains(r.ClassId.Value)) continue;
                if (r.RestoreStatus == "Pending")
                {
                    r.RestoreStatus = "Rejected";
                    r.ReviewedDate = DateTime.Now;
                    r.ReviewedBy = userId;
                    updated++;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xử lý yêu cầu", updated });
        }

        [HttpPost("attendance/requests/approve-by")]
        public async Task<IActionResult> ApproveRestoreByStudentDate([FromBody] ApproveByStudentDateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var cls = _context.Classes.FirstOrDefault(c => c.Id == dto.ClassId && c.TeacherId == userId);
            if (cls == null) return NotFound("Không tìm thấy lớp hoặc bạn không có quyền truy cập");

            var dayStart = dto.Date.Date;
            var dayEnd = dayStart.AddDays(1);
            var att = _context.Set<Attendance>().FirstOrDefault(a => a.StudentId == dto.StudentId && a.ClassId == dto.ClassId && a.Date >= dayStart && a.Date < dayEnd);
            if (att == null) return NotFound("Không tìm thấy bản ghi điểm danh");
            if (!att.RestoreRequested || att.RestoreStatus != "Pending") return BadRequest("Bản ghi không có yêu cầu đang chờ");

            att.RestoreStatus = "Approved";
            att.ReviewedDate = DateTime.Now;
            att.ReviewedBy = userId;
            att.Present = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã duyệt yêu cầu khôi phục" });
        }

        [HttpPost("attendance/requests/{requestId}/reject")]
        public async Task<IActionResult> RejectRestoreRequest(int requestId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var req = _context.Set<Attendance>().FirstOrDefault(a => a.Id == requestId);
            if (req == null) return NotFound("Không tìm thấy yêu cầu");

            var cls = _context.Classes.FirstOrDefault(c => c.Id == req.ClassId);
            if (cls == null || cls.TeacherId != userId) return Forbid();

            req.RestoreStatus = "Rejected";
            req.ReviewedDate = DateTime.Now;
            req.ReviewedBy = userId;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã từ chối yêu cầu khôi phục" });
        }

        // note: class creation moved to AdminController (Admin-only)

        public class UpdateClassDto
        {
            public string? Name { get; set; }
            public string? Schedule { get; set; }
            public DateTime? StartDate { get; set; }
        }

        // ===== ĐIỂM DANH =====
        public class AttendanceEntryDto
        {
            public string StudentId { get; set; } = null!;
            public bool Present { get; set; }
            public int? AttendanceId { get; set; }
        }

        public class SaveAttendanceDto
        {
            public DateTime Date { get; set; }
            public List<AttendanceEntryDto> Entries { get; set; } = new List<AttendanceEntryDto>();
        }

        public class BulkRequestActionDto
        {
            public List<int> RequestIds { get; set; } = new List<int>();
        }

        public class ApproveByStudentDateDto
        {
            [Required]
            public string StudentId { get; set; } = null!;
            [Required]
            public int ClassId { get; set; }
            [Required]
            public DateTime Date { get; set; }
        }

        [HttpGet("classes/{classId}/attendance")]
        public async Task<IActionResult> GetAttendance(int classId, [FromQuery] DateTime? date)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var cls = _context.Classes.FirstOrDefault(c => c.Id == classId && c.TeacherId == userId);
            if (cls == null) return NotFound("Không tìm thấy lớp hoặc bạn không có quyền truy cập");

            var targetDate = (date ?? DateTime.Now).Date;

            // load enrollments (approved) and students
            var enrollments = _context.Set<Enrollment>().Where(e => e.ClassId == classId).ToList();
            var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

            // load existing attendance records for that date
            var dayStart = targetDate;
            var dayEnd = targetDate.AddDays(1);
            var atts = _context.Set<Attendance>().Where(a => a.ClassId == classId && a.Date >= dayStart && a.Date < dayEnd).ToList();

            var result = new List<object>();
            foreach (var sid in studentIds)
            {
                var user = await _userManager.FindByIdAsync(sid);
                var att = atts.FirstOrDefault(a => a.StudentId == sid);
                result.Add(new
                {
                    studentId = sid,
                    studentName = user?.FullName ?? user?.UserName ?? "Không rõ",
                    studentEmail = user?.Email,
                    attendanceId = att?.Id,
                    present = att?.Present ?? false
                });
            }

            return Ok(result);
        }

        [HttpPost("classes/{classId}/attendance")]
        public async Task<IActionResult> SaveAttendance(int classId, [FromBody] SaveAttendanceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var cls = _context.Classes.FirstOrDefault(c => c.Id == classId && c.TeacherId == userId);
            if (cls == null) return NotFound("Không tìm thấy lớp hoặc bạn không có quyền truy cập");

            var targetDate = dto.Date.Date;
            var dayStart = targetDate;
            var dayEnd = targetDate.AddDays(1);

            foreach (var entry in dto.Entries)
            {
                var existing = _context.Set<Attendance>().FirstOrDefault(a => a.ClassId == classId && a.StudentId == entry.StudentId && a.Date >= dayStart && a.Date < dayEnd);
                if (existing != null)
                {
                    existing.Present = entry.Present;
                }
                else
                {
                    var att = new Attendance
                    {
                        StudentId = entry.StudentId,
                        ClassId   = classId,
                        Date      = targetDate,
                        Present   = entry.Present,
                        RestoreRequested = false,
                    };
                    _context.Set<Attendance>().Add(att);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã lưu điểm danh" });
        }
    }
}