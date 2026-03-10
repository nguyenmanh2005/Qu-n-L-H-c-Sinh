namespace StudentManagement.Entities;
public class Assignment
{
    public int       Id          { get; set; }
    public string    Title       { get; set; } = string.Empty;
    public string?   Description { get; set; }
    public int       ClassId     { get; set; }
    public Class?    Class       { get; set; }
    public string    TeacherId   { get; set; } = string.Empty;
    public DateTime  OpenAt      { get; set; }   // giờ mở nộp
    public DateTime  DueAt       { get; set; }   // hạn nộp → quá giờ khóa
    public DateTime  CreatedAt   { get; set; } = DateTime.Now;
}