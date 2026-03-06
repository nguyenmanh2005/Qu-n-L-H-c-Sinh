namespace StudentManagement.DTOs;

public class ClassDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Schedule { get; set; }
    public DateTime? StartDate { get; set; }
    public string? TeacherId { get; set; }
    public string? TeacherName { get; set; }
}