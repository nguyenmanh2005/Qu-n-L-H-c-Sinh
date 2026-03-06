using System.ComponentModel.DataAnnotations;

namespace StudentManagement.DTOs;

// ─────────────────────────────────────────────
//  REQUEST DTOs  (Client → Server)
// ─────────────────────────────────────────────

public class JoinClassRequestDto
{
    [Required(ErrorMessage = "Mã lớp là bắt buộc")]
    public string ClassCode { get; set; } = string.Empty;
}

public class RestoreAttendanceDto
{
    [Required]
    public int AttendanceId { get; set; }
    public string? Reason { get; set; }
}

public class RestoreAttendanceByInfoDto
{
    [Required]
    public int ClassId { get; set; }
    [Required]
    public DateTime Date { get; set; }
    public string? Reason { get; set; }
}

// ─────────────────────────────────────────────
//  RESPONSE DTOs  (Server → Client)
// ─────────────────────────────────────────────

public class StudentProfileDto
{
    public string Id          { get; set; } = string.Empty;
    public string? Username   { get; set; }
    public string? FullName   { get; set; }
    public string? Email      { get; set; }
    public string? PhoneNumber { get; set; }
}

public class StudentClassDto
{
    public int      ClassId    { get; set; }
    public string   Name       { get; set; } = string.Empty;
    public string   Code       { get; set; } = string.Empty;
    public string?  Schedule   { get; set; }
    public DateTime? StartDate { get; set; }
    public string   Teacher    { get; set; } = string.Empty;
    public string   Status     { get; set; } = string.Empty;
    public DateTime? JoinedDate { get; set; }
}

public class StudentScheduleDto
{
    public int       ClassId     { get; set; }
    public string    ClassName   { get; set; } = string.Empty;
    public string    ClassCode   { get; set; } = string.Empty;
    public string?   ScheduleRaw { get; set; }
    public DateTime? StartDate   { get; set; }
    public string    TeacherName { get; set; } = string.Empty;
    // Structured schedule data – parsed từ ScheduleRaw
    public List<ScheduleSlotDto> Slots { get; set; } = new();
}

public class ScheduleSlotDto
{
    public int    DayOfWeek   { get; set; }   // 0=CN, 1=T2 ... 6=T7
    public string DayName     { get; set; } = string.Empty;
    public int?   SlotNumber  { get; set; }   // 1–7, null nếu nhập giờ thủ công
    public string TimeStart   { get; set; } = string.Empty;
    public string TimeEnd     { get; set; } = string.Empty;
    public string? Room       { get; set; }
}

public class AttendanceRecordDto
{
    public int       Id               { get; set; }
    public int?      ClassId          { get; set; }
    public string?   ClassName        { get; set; }
    public DateTime? Date             { get; set; }
    public bool?     Present          { get; set; }
    public bool      RestoreRequested { get; set; }
    public string?   RestoreStatus    { get; set; }
    public string?   RestoreReason    { get; set; }
    public DateTime? RequestDate      { get; set; }
    public DateTime? ReviewedDate     { get; set; }
}

public class AttendanceSummaryDto
{
    public int    ClassId         { get; set; }
    public string ClassName       { get; set; } = string.Empty;
    public string ClassCode       { get; set; } = string.Empty;
    public int    Present         { get; set; }
    public int    Absent          { get; set; }
    public int    Total           { get; set; }
    public int    PendingRestore  { get; set; }
    public int    ApprovedRestore { get; set; }
    public double AttendanceRate  { get; set; }
}