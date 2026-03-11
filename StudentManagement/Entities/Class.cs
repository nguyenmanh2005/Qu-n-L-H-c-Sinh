namespace StudentManagement.Entities;

public class Class
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;       
    public string Code { get; set; } = string.Empty;       
    public string? Schedule { get; set; }                  
    public DateTime? StartDate { get; set; }

    // Quan hệ (nếu có giáo viên phụ trách)
    public string? TeacherId { get; set; }                 
    public User? Teacher { get; set; }

    // Danh sách học sinh tham gia (navigation property)
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}