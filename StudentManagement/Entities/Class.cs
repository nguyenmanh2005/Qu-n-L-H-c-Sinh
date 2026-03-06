namespace StudentManagement.Entities;

public class Class
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;       // Tên lớp: "Lập trình Web 2025"
    public string Code { get; set; } = string.Empty;       // Mã lớp: "WEB2025" (dùng để join)
    public string? Schedule { get; set; }                  // Lịch học: "Thứ 3, Thứ 5 - 18:00"
    public DateTime? StartDate { get; set; }

    // Quan hệ (nếu có giáo viên phụ trách)
    public string? TeacherId { get; set; }                 // FK đến User (giáo viên)
    public User? Teacher { get; set; }

    // Danh sách học sinh tham gia (navigation property)
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}