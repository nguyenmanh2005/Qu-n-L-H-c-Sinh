using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using StudentManagement.DTOs;
using StudentManagement.Services.Interfaces;

namespace StudentManagement.Controllers;

// ════════════════════════════════════════════════════════════
//  TEACHER — tạo bài, chấm điểm
// ════════════════════════════════════════════════════════════
[Authorize(Roles = "Teacher")]
[Route("api/teacher/assignments")]
[ApiController]
public class TeacherAssignmentController : ControllerBase
{
    private readonly IAssignmentService  _service;
    private readonly IWebHostEnvironment _env;

    public TeacherAssignmentController(IAssignmentService service, IWebHostEnvironment env)
    {
        _service = service;
        _env     = env;
    }

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetMyAssignments()
        => Ok(await _service.GetByTeacherAsync(UserId()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentDto dto)
    {
        try { return Ok(await _service.CreateAsync(UserId(), dto)); }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAssignmentDto dto)
    {
        try { return Ok(await _service.UpdateAsync(UserId(), id, dto)); }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _service.DeleteAsync(UserId(), id); return Ok(new { message = "Đã xóa bài tập" }); }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpGet("{id}/submissions")]
    public async Task<IActionResult> GetSubmissions(int id)
    {
        try { return Ok(await _service.GetSubmissionsAsync(UserId(), id)); }
        catch (KeyNotFoundException ex)     { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpPost("submissions/{submissionId}/grade")]
    public async Task<IActionResult> Grade(int submissionId, [FromBody] GradeSubmissionDto dto)
    {
        try { await _service.GradeAsync(UserId(), submissionId, dto); return Ok(new { message = "Đã chấm điểm" }); }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
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

    [HttpGet]
    public async Task<IActionResult> GetMyAssignments()
        => Ok(await _service.GetForStudentAsync(UserId()));

    [HttpGet("my-submissions")]
    public async Task<IActionResult> GetMySubmissions()
        => Ok(await _service.GetMySubmissionsAsync(UserId()));

    [HttpPost("{assignmentId}/submit")]
    public async Task<IActionResult> Submit(int assignmentId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn file" });

        try
        {
            var (filePath, fileName) = await SaveFileAsync(file);
            return Ok(await _service.SubmitAsync(UserId(), assignmentId, fileName, filePath));
        }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("submissions/{submissionId}")]
    public async Task<IActionResult> UpdateSubmission(int submissionId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Vui lòng chọn file" });

        try
        {
            var (filePath, fileName) = await SaveFileAsync(file);
            return Ok(await _service.UpdateSubmissionAsync(UserId(), submissionId, fileName, filePath));
        }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    private async Task<(string filePath, string fileName)> SaveFileAsync(IFormFile file)
    {
        var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "submissions");
        Directory.CreateDirectory(uploadsDir);

        var ext      = Path.GetExtension(file.FileName);
        var unique   = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(uploadsDir, unique);

        await using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream);

        return ($"/uploads/submissions/{unique}", file.FileName);
    }
}


// ════════════════════════════════════════════════════════════
//  ADMIN — xem tất cả, chấm điểm, xóa
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

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{assignmentId}/submissions")]
    public async Task<IActionResult> GetSubmissions(int assignmentId)
    {
        try { return Ok(await _service.GetAllSubmissionsAsync(assignmentId)); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpPost("submissions/{submissionId}/grade")]
    public async Task<IActionResult> Grade(int submissionId, [FromBody] GradeSubmissionDto dto)
    {
        try { await _service.AdminGradeAsync(submissionId, UserId(), dto); return Ok(new { message = "Đã lưu điểm thành công" }); }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("submissions/{submissionId}")]
    public async Task<IActionResult> DeleteSubmission(int submissionId)
    {
        try { await _service.AdminDeleteSubmissionAsync(submissionId); return Ok(new { message = "Đã xóa bài nộp" }); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    [HttpDelete("{assignmentId}")]
    public async Task<IActionResult> DeleteAssignment(int assignmentId)
    {
        try { await _service.AdminDeleteAssignmentAsync(assignmentId); return Ok(new { message = "Đã xóa bài tập và tất cả bài nộp" }); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }
}