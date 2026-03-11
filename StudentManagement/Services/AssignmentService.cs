using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Data;
using StudentManagement.DTOs;
using StudentManagement.Entities;
using StudentManagement.Services.Interfaces;

namespace StudentManagement.Services;

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext      _context;
    private readonly UserManager<User> _userManager;

    public AssignmentService(AppDbContext context, UserManager<User> userManager)
    {
        _context     = context;
        _userManager = userManager;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<AssignmentDto> ToDto(Assignment a)
    {
        var teacher = await _userManager.FindByIdAsync(a.TeacherId);
        var cls     = await _context.Classes.FindAsync(a.ClassId);
        var now     = DateTime.Now;
        return new AssignmentDto
        {
            Id              = a.Id,
            Title           = a.Title,
            Description     = a.Description,
            ClassId         = a.ClassId,
            ClassName       = cls?.Name ?? "",
            TeacherId       = a.TeacherId,
            TeacherName     = teacher?.FullName ?? teacher?.UserName,
            OpenAt          = a.OpenAt,
            DueAt           = a.DueAt,
            CreatedAt       = a.CreatedAt,
            IsOpen          = now >= a.OpenAt && now <= a.DueAt,
            IsExpired       = now > a.DueAt,
            SubmissionCount = _context.Submissions.Count(s => s.AssignmentId == a.Id),
        };
    }

    private async Task<SubmissionDto> ToSubmissionDto(Submission s)
    {
        var student    = await _userManager.FindByIdAsync(s.StudentId);
        var assignment = await _context.Assignments.FindAsync(s.AssignmentId);
        return new SubmissionDto
        {
            Id              = s.Id,
            AssignmentId    = s.AssignmentId,
            AssignmentTitle = assignment?.Title ?? "",
            StudentId       = s.StudentId,
            StudentName     = student?.FullName ?? student?.UserName,
            StudentEmail    = student?.Email,
            FileName        = s.FileName,
            SubmittedAt     = s.SubmittedAt,
            IsLate          = s.IsLate,
            Score           = s.Score,
            Feedback        = s.Feedback,
            GradedAt        = s.GradedAt,
            IsGraded        = s.Score.HasValue,
        };
    }

    private async Task<MySubmissionDto> ToMySubmissionDto(Submission s, Assignment a)
    {
        var cls = await _context.Classes.FindAsync(a.ClassId);
        return new MySubmissionDto
        {
            Id              = s.Id,
            AssignmentId    = a.Id,
            AssignmentTitle = a.Title,
            ClassName       = cls?.Name ?? "",
            DueAt           = a.DueAt,
            FileName        = s.FileName,
            SubmittedAt     = s.SubmittedAt,
            IsLate          = s.IsLate,
            Score           = s.Score,
            Feedback        = s.Feedback,
            GradedAt        = s.GradedAt,
            CanEdit         = DateTime.Now <= a.DueAt,
        };
    }

    // ── Teacher ───────────────────────────────────────────────────────────────

    public async Task<AssignmentDto> CreateAsync(string teacherId, CreateAssignmentDto dto)
    {
        var cls = await _context.Classes.FindAsync(dto.ClassId)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp");
        if (cls.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Bạn không phụ trách lớp này");
        if (dto.DueAt <= dto.OpenAt)
            throw new InvalidOperationException("Hạn nộp phải sau giờ mở");

        var assignment = new Assignment
        {
            Title       = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            ClassId     = dto.ClassId,
            TeacherId   = teacherId,
            OpenAt      = dto.OpenAt,
            DueAt       = dto.DueAt,
            CreatedAt   = DateTime.Now,
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();
        return await ToDto(assignment);
    }

    public async Task<AssignmentDto> UpdateAsync(string teacherId, int assignmentId, UpdateAssignmentDto dto)
    {
        var assignment = await _context.Assignments.FindAsync(assignmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài tập");
        if (assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException();

        if (!string.IsNullOrWhiteSpace(dto.Title))       assignment.Title       = dto.Title.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Description)) assignment.Description = dto.Description.Trim();
        if (dto.OpenAt.HasValue) assignment.OpenAt = dto.OpenAt.Value;
        if (dto.DueAt.HasValue)  assignment.DueAt  = dto.DueAt.Value;

        if (assignment.DueAt <= assignment.OpenAt)
            throw new InvalidOperationException("Hạn nộp phải sau giờ mở");

        await _context.SaveChangesAsync();
        return await ToDto(assignment);
    }

    public async Task DeleteAsync(string teacherId, int assignmentId)
    {
        var assignment = await _context.Assignments.FindAsync(assignmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài tập");
        if (assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException();

        var submissions = _context.Submissions.Where(s => s.AssignmentId == assignmentId);
        _context.Submissions.RemoveRange(submissions);
        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AssignmentDto>> GetByTeacherAsync(string teacherId)
    {
        var assignments = await _context.Assignments
            .Where(a => a.TeacherId == teacherId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var result = new List<AssignmentDto>();
        foreach (var a in assignments)
            result.Add(await ToDto(a));
        return result;
    }

    public async Task<List<SubmissionDto>> GetSubmissionsAsync(string teacherId, int assignmentId)
    {
        var assignment = await _context.Assignments.FindAsync(assignmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài tập");
        if (assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException();

        var submissions = await _context.Submissions
            .Where(s => s.AssignmentId == assignmentId)
            .OrderBy(s => s.SubmittedAt)
            .ToListAsync();

        var result = new List<SubmissionDto>();
        foreach (var s in submissions)
            result.Add(await ToSubmissionDto(s));
        return result;
    }

    public async Task GradeAsync(string teacherId, int submissionId, GradeSubmissionDto dto)
    {
        var submission = await _context.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài nộp");

        if (submission.Assignment!.TeacherId != teacherId)
            throw new UnauthorizedAccessException();

        submission.Score    = dto.Score;
        submission.Feedback = dto.Feedback?.Trim();
        submission.GradedAt = DateTime.Now;
        submission.GradedBy = teacherId;
        await _context.SaveChangesAsync();
    }

    // ── Student ───────────────────────────────────────────────────────────────

    public async Task<List<AssignmentDto>> GetForStudentAsync(string studentId)
    {
        var classIds = await _context.Set<Enrollment>()
            .Where(e => e.StudentId == studentId && e.Status == "Approved")
            .Select(e => e.ClassId)
            .ToListAsync();

        var assignments = await _context.Assignments
            .Where(a => classIds.Contains(a.ClassId))
            .OrderByDescending(a => a.DueAt)
            .ToListAsync();

        var result = new List<AssignmentDto>();
        foreach (var a in assignments)
            result.Add(await ToDto(a));
        return result;
    }

    public async Task<MySubmissionDto> SubmitAsync(string studentId, int assignmentId, string fileName, string filePath)
    {
        var assignment = await _context.Assignments.FindAsync(assignmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài tập");

        var now = DateTime.Now;
        if (now < assignment.OpenAt)
            throw new InvalidOperationException("Bài tập chưa mở nộp");
        if (now > assignment.DueAt)
            throw new InvalidOperationException("Đã quá hạn nộp bài");

        var existing = await _context.Submissions
            .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId);
        if (existing != null)
            throw new InvalidOperationException("Bạn đã nộp bài này rồi, hãy dùng chức năng sửa bài");

        var submission = new Submission
        {
            AssignmentId = assignmentId,
            StudentId    = studentId,
            FileName     = fileName,
            FilePath     = filePath,
            SubmittedAt  = now,
            IsLate       = now > assignment.DueAt,
        };

        _context.Submissions.Add(submission);
        await _context.SaveChangesAsync();
        return await ToMySubmissionDto(submission, assignment);
    }

    public async Task<MySubmissionDto> UpdateSubmissionAsync(string studentId, int submissionId, string fileName, string filePath)
    {
        var submission = await _context.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài nộp");

        if (submission.StudentId != studentId)
            throw new UnauthorizedAccessException();
        if (DateTime.Now > submission.Assignment!.DueAt)
            throw new InvalidOperationException("Đã quá hạn, không thể sửa bài");

        submission.FileName    = fileName;
        submission.FilePath    = filePath;
        submission.SubmittedAt = DateTime.Now;
        submission.Score       = null;
        submission.GradedAt    = null;
        submission.GradedBy    = null;
        submission.Feedback    = null;

        await _context.SaveChangesAsync();
        return await ToMySubmissionDto(submission, submission.Assignment);
    }

    public async Task<List<MySubmissionDto>> GetMySubmissionsAsync(string studentId)
    {
        var submissions = await _context.Submissions
            .Include(s => s.Assignment)
            .Where(s => s.StudentId == studentId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        var result = new List<MySubmissionDto>();
        foreach (var s in submissions)
            result.Add(await ToMySubmissionDto(s, s.Assignment!));
        return result;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public async Task<List<AssignmentDto>> GetAllAsync()
    {
        var assignments = await _context.Assignments
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var result = new List<AssignmentDto>();
        foreach (var a in assignments)
            result.Add(await ToDto(a));
        return result;
    }

    public async Task<List<SubmissionDto>> GetAllSubmissionsAsync(int assignmentId)
    {
        _ = await _context.Assignments.FindAsync(assignmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài tập");

        var submissions = await _context.Submissions
            .Where(s => s.AssignmentId == assignmentId)
            .OrderBy(s => s.SubmittedAt)
            .ToListAsync();

        var result = new List<SubmissionDto>();
        foreach (var s in submissions)
            result.Add(await ToSubmissionDto(s));
        return result;
    }

    public async Task AdminGradeAsync(int submissionId, string graderId, GradeSubmissionDto dto)
    {
        var submission = await _context.Submissions.FindAsync(submissionId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài nộp");

        if (dto.Score < 0 || dto.Score > 10)
            throw new InvalidOperationException("Điểm phải từ 0 đến 10");

        submission.Score    = dto.Score;
        submission.Feedback = dto.Feedback?.Trim();
        submission.GradedAt = DateTime.Now;
        submission.GradedBy = graderId;
        await _context.SaveChangesAsync();
    }

    public async Task AdminDeleteSubmissionAsync(int submissionId)
    {
        var submission = await _context.Submissions.FindAsync(submissionId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài nộp");

        _context.Submissions.Remove(submission);
        await _context.SaveChangesAsync();
    }

    public async Task AdminDeleteAssignmentAsync(int assignmentId)
    {
        var assignment = await _context.Assignments.FindAsync(assignmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài tập");

        var submissions = _context.Submissions.Where(s => s.AssignmentId == assignmentId);
        _context.Submissions.RemoveRange(submissions);
        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync();
    }
}