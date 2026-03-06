namespace StudentManagement.Entities;

public class Enrollment
{
    public int Id { get; set; }

    public string StudentId { get; set; } = string.Empty;   // FK đến User (học sinh)
    public User? Student { get; set; }

    public int ClassId { get; set; }                        // FK đến Class
    public Class? Class { get; set; }

    public string Status { get; set; } = "Pending";         // Pending / Approved / Rejected
    public DateTime RequestDate { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedDate { get; set; }
}