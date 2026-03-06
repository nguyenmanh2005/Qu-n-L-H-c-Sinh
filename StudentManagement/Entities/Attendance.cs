namespace StudentManagement.Entities;

public class Attendance
{
    public int Id { get; set; }
    public string? StudentId { get; set; }
    public int? ClassId { get; set; }
    public DateTime? Date { get; set; }
    public bool? Present { get; set; }

    // Restore request fields
    public bool RestoreRequested { get; set; }
    public string? RestoreReason { get; set; }
    public string? RestoreStatus { get; set; } // Pending/Approved/Rejected
    public DateTime? RequestDate { get; set; }
    public DateTime? ReviewedDate { get; set; }
    public string? ReviewedBy { get; set; }
}
