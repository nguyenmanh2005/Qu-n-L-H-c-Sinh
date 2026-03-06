namespace StudentManagement.Entities;

public class Student
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    // Link to Identity user
    public string? UserId { get; set; }
}