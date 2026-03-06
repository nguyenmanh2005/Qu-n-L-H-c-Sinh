using System.ComponentModel.DataAnnotations;

namespace StudentManagement.Entities
{
    public class Course
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Credits { get; set; }
    }
}