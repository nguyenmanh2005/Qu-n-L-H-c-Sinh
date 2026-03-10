using System.ComponentModel.DataAnnotations;

namespace StudentManagement.DTOs;

// ─────────────────────────────────────────────
//  ASSIGNMENT DTOs
// ─────────────────────────────────────────────

// Teacher tạo bài tập
public class CreateAssignmentDto
{
    [Required] public string   Title       { get; set; } = string.Empty;
    public string?             Description { get; set; }
    [Required] public int      ClassId     { get; set; }
    [Required] public DateTime OpenAt      { get; set; }
    [Required] public DateTime DueAt       { get; set; }
}

// Teacher sửa bài tập
public class UpdateAssignmentDto
{
    public string?   Title       { get; set; }
    public string?   Description { get; set; }
    public DateTime? OpenAt      { get; set; }
    public DateTime? DueAt       { get; set; }
}

// Trả về FE
public class AssignmentDto
{
    public int      Id          { get; set; }
    public string   Title       { get; set; } = string.Empty;
    public string?  Description { get; set; }
    public int      ClassId     { get; set; }
    public string   ClassName   { get; set; } = string.Empty;
    public string   TeacherId   { get; set; } = string.Empty;
    public string?  TeacherName { get; set; }
    public DateTime OpenAt      { get; set; }
    public DateTime DueAt       { get; set; }
    public DateTime CreatedAt   { get; set; }
    public bool     IsOpen      { get; set; }   // OpenAt <= now <= DueAt
    public bool     IsExpired   { get; set; }   // now > DueAt
    public int      SubmissionCount { get; set; }
}

// ─────────────────────────────────────────────
//  SUBMISSION DTOs
// ─────────────────────────────────────────────

// Trả về FE (Teacher xem danh sách bài nộp)
public class SubmissionDto
{
    public int       Id           { get; set; }
    public int       AssignmentId { get; set; }
    public string    AssignmentTitle { get; set; } = string.Empty;
    public string    StudentId    { get; set; } = string.Empty;
    public string?   StudentName  { get; set; }
    public string?   StudentEmail { get; set; }
    public string    FileName     { get; set; } = string.Empty;
    public DateTime  SubmittedAt  { get; set; }
    public bool      IsLate       { get; set; }
    public double?   Score        { get; set; }
    public string?   Feedback     { get; set; }
    public DateTime? GradedAt     { get; set; }
    public bool      IsGraded     { get; set; }  // Score != null
}

// Teacher chấm điểm
public class GradeSubmissionDto
{
    [Required]
    [Range(0, 10, ErrorMessage = "Điểm phải từ 0 đến 10")]
    public double  Score    { get; set; }
    public string? Feedback { get; set; }
}

// Student xem điểm của mình
public class MySubmissionDto
{
    public int       Id              { get; set; }
    public int       AssignmentId    { get; set; }
    public string    AssignmentTitle { get; set; } = string.Empty;
    public string    ClassName       { get; set; } = string.Empty;
    public DateTime  DueAt           { get; set; }
    public string    FileName        { get; set; } = string.Empty;
    public DateTime  SubmittedAt     { get; set; }
    public bool      IsLate          { get; set; }
    public double?   Score           { get; set; }
    public string?   Feedback        { get; set; }
    public DateTime? GradedAt        { get; set; }
    public bool      CanEdit         { get; set; }  // còn trong hạn → được sửa
}