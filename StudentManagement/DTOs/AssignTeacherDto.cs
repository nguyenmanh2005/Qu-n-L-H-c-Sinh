using System.ComponentModel.DataAnnotations;

namespace StudentManagement.DTOs;

public class AssignTeacherDto
{
    [Required] public string TeacherId { get; set; } = string.Empty;
}