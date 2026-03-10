using System.ComponentModel.DataAnnotations;

namespace StudentManagement.DTOs;

// ── Profile ──────────────────────────────────────────────────
public class TeacherProfileDto
{
    public string  Id          { get; set; } = null!;
    public string? Username    { get; set; }
    public string? FullName    { get; set; }
    public string? Email       { get; set; }
    public string? PhoneNumber { get; set; }
    // public int     ClassCount  { get; set; }
}

// ── Lớp học ──────────────────────────────────────────────────
public class TeacherClassDto
{
    public int       Id           { get; set; }
    public string    Name         { get; set; } = null!;
    public string    Code         { get; set; } = null!;
    public string?   Schedule     { get; set; }
    public DateTime? StartDate    { get; set; }
    public int       StudentCount { get; set; }
}

public class UpdateClassDto
{
    public string?   Name      { get; set; }
    public string?   Schedule  { get; set; }
    public DateTime? StartDate { get; set; }
}

// ── Học sinh trong lớp ───────────────────────────────────────
public class StudentInClassDto
{
    public int       EnrollmentId       { get; set; }
    public string    StudentId          { get; set; } = null!;
    public string    StudentName        { get; set; } = null!;
    public string?   Email              { get; set; }
    public string    Status             { get; set; } = null!;
    public DateTime  RequestDate        { get; set; }
    public DateTime? ApprovedDate       { get; set; }

    // Điểm danh hôm nay
    public int?      AttendanceId       { get; set; }
    public bool      Present            { get; set; }
    public bool      RestoreRequested   { get; set; }
    public string?   RestoreStatus      { get; set; }
    public string?   RestoreReason      { get; set; }
    public DateTime? RestoreRequestDate { get; set; }
}

public class ClassStudentListDto
{
    public int    ClassId   { get; set; }
    public string ClassName { get; set; } = null!;
    public string ClassCode { get; set; } = null!;
    public List<StudentInClassDto> Students { get; set; } = new();
}

// ── Điểm danh ────────────────────────────────────────────────
public class TeacherAttendanceRecordDto
{
    public string  StudentId    { get; set; } = null!;
    public string  StudentName  { get; set; } = null!;
    public string? StudentEmail { get; set; }
    public int?    AttendanceId { get; set; }
    public bool    Present      { get; set; }
}

public class AttendanceEntryDto
{
    public string StudentId    { get; set; } = null!;
    public bool   Present      { get; set; }
    public int?   AttendanceId { get; set; }
}

public class SaveAttendanceDto
{
    public DateTime                 Date    { get; set; }
    public List<AttendanceEntryDto> Entries { get; set; } = new();
}

// ── Restore requests ─────────────────────────────────────────
public class RestoreRequestDto
{
    public int       Id            { get; set; }
    public int?      ClassId       { get; set; }
    public DateTime? Date          { get; set; }
    public bool?     Present       { get; set; }
    public string?   RestoreReason { get; set; }
    public DateTime? RequestDate   { get; set; }
    public string    StudentId     { get; set; } = null!;
    public string    StudentName   { get; set; } = null!;
    public string?   StudentEmail  { get; set; }
}

public class BulkRequestActionDto
{
    public List<int> RequestIds { get; set; } = new();
}

public class ApproveByStudentDateDto
{
    [Required] public string   StudentId { get; set; } = null!;
    [Required] public int      ClassId   { get; set; }
    [Required] public DateTime Date      { get; set; }
}