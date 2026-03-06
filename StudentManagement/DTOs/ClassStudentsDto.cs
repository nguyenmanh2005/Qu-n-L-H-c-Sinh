using System.Collections.Generic;

namespace StudentManagement.DTOs;

public class ClassStudentsDto
{
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public List<StudentEnrollmentDto> Students { get; set; } = new List<StudentEnrollmentDto>();
}

public class StudentEnrollmentDto
{
    public int EnrollmentId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string? StudentName { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RequestDate { get; set; }
    public DateTime? ApprovedDate { get; set; }
}