using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentManagement.DTOs;
using StudentManagement.Services.Interfaces;
using System.Security.Claims;

namespace StudentManagement.Controllers;

// ════════════════════════════════════════════════════════════
//  TEACHER — tạo bài, chấm điểm
// ════════════════════════════════════════════════════════════
[Authorize(Roles = "Teacher")]
[Route("api/teacher/assignments")]
[ApiController]
public class TeacherAssignmentController : ControllerBase
{
    private readonly IAssignmentService _service;
    private readonly IWebHostEnvironment _env;

    public TeacherAssignmentController(IAssignmentService service, IWebHostEnvironment env)
    {
        _service = service;
        _env     = env;
    }

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // Xem bài tập mình tạo
    [HttpGet]
    public async Task<IActionResult> GetMyAssignments()
    {
        var result = await _service.GetByTeacherAsync(UserId());
        return Ok(result);
    }

    // Tạo bài tập mới
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentDto dto)
    {
        try
        {
            var result = await _service.CreateAsync(UserId(), dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    // Sửa bài tập
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAssignmentDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(UserId(), id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    // Xóa bài tập
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _service.DeleteAsync(UserId(), id);
            return Ok(new { message = "Đã xóa bài tập" });
        }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    // Xem danh sách bài nộp của 1 bài tập
    [HttpGet("{id}/submissions")]
    public async Task<IActionResult> GetSubmissions(int id)
    {
        try
        {
            var result = await _service.GetSubmissionsAsync(UserId(), id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    // Download file bài nộp
    [HttpGet("submissions/{submissionId}/download")]
    public IActionResult Download(int submissionId)
    {
        // TODO: lấy filePath từ DB rồi trả file
        // Tạm thời để trống, sẽ implement sau
        return Ok();
    }

    // Chấm điểm
    [HttpPost("submissions/{submissionId}/grade")]
    public async Task<IActionResult> Grade(int submissionId, [FromBody] GradeSubmissionDto dto)
    {
        try
        {
            await _service.GradeAsync(UserId(), submissionId, dto);
            return Ok(new { message = "Đã chấm điểm" });
        }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}


// ════════════════════════════════════════════════════════════
//  STUDENT — xem bài, nộp bài, sửa bài, xem điểm
// ════════════════════════════════════════════════════════════
[Authorize(Roles = "Student")]
[Route("api/student/assignments")]
[ApiController]
public class StudentAssignmentController : ControllerBase
{
    private readonly IAssignmentService  _service;
    private readonly IWebHostEnvironment _env;

    public StudentAssignmentController(IAssignmentService service, IWebHostEnvironment env)
    {
        _service = service;
        _env     = env;
    }

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // Xem bài tập của lớp mình
    [HttpGet]
    public async Task<IActionResult> GetMyAssignments()
    {
        var result = await _service.GetForStudentAsync(UserId());
        return Ok(result);
    }

    // Xem bài đã nộp + điểm
    [HttpGet("my-submissions")]
    public async Task<IActionResult> GetMySubmissions()
    {
        var result = await _service.GetMySubmissionsAsync(UserId());
        return Ok(result);
    }

    // Nộp bài (upload file)
    [HttpPost("{assignmentId}/submit")]
    public async Task<IActionResult> Submit(int assignmentId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn file" });

        try
        {
            // Lưu file vào wwwroot/uploads/submissions/
            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "submissions");
            Directory.CreateDirectory(uploadsDir);

            // Đặt tên file unique để tránh trùng
            var ext      = Path.GetExtension(file.FileName);
            var savedName = $"{Guid.NewGuid()}{ext}";
            var filePath  = Path.Combine(uploadsDir, savedName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var result = await _service.SubmitAsync(
                UserId(), assignmentId,
                fileName: file.FileName,   // tên gốc hiển thị
                filePath: $"uploads/submissions/{savedName}" // đường dẫn lưu
            );

            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
    }

    // Sửa bài (upload file mới)
    [HttpPut("submissions/{submissionId}")]
    public async Task<IActionResult> UpdateSubmission(int submissionId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn file" });

        try
        {
            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "submissions");
            Directory.CreateDirectory(uploadsDir);

            var ext      = Path.GetExtension(file.FileName);
            var savedName = $"{Guid.NewGuid()}{ext}";
            var filePath  = Path.Combine(uploadsDir, savedName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var result = await _service.UpdateSubmissionAsync(
                UserId(), submissionId,
                fileName: file.FileName,
                filePath: $"uploads/submissions/{savedName}"
            );

            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
    }
}


// ════════════════════════════════════════════════════════════
//  ADMIN — xem tất cả, xóa bài nộp
// ════════════════════════════════════════════════════════════
[Authorize(Roles = "Admin")]
[Route("api/admin/assignments")]
[ApiController]
public class AdminAssignmentController : ControllerBase
{
    private readonly IAssignmentService _service;

    public AdminAssignmentController(IAssignmentService service)
    {
        _service = service;
    }

    // Xem tất cả bài tập
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    // Xem bài nộp của 1 bài tập
    [HttpGet("{assignmentId}/submissions")]
    public async Task<IActionResult> GetSubmissions(int assignmentId)
    {
        try
        {
            var result = await _service.GetAllSubmissionsAsync(assignmentId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    // Xóa bài nộp của học sinh
    [HttpDelete("submissions/{submissionId}")]
    public async Task<IActionResult> DeleteSubmission(int submissionId)
    {
        try
        {
            await _service.AdminDeleteSubmissionAsync(submissionId);
            return Ok(new { message = "Đã xóa bài nộp" });
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    // Xóa cả bài tập (kèm tất cả bài nộp)
    [HttpDelete("{assignmentId}")]
    public async Task<IActionResult> DeleteAssignment(int assignmentId)
    {
        try
        {
            await _service.AdminDeleteAssignmentAsync(assignmentId);
            return Ok(new { message = "Đã xóa bài tập và tất cả bài nộp" });
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }
}