namespace StudentManagement.DTOs;

public class ClassMembersDto
{
    public int              ClassId   { get; set; }
    public string           ClassName { get; set; } = string.Empty;
    public string           ClassCode { get; set; } = string.Empty;
    public string?          Schedule  { get; set; }
    public TeacherInfoDto?  Teacher   { get; set; }
    public List<MemberDto>  Members   { get; set; } = new();
}

public class TeacherInfoDto
{
    public string  UserId   { get; set; } = string.Empty;
    public string  FullName { get; set; } = string.Empty;
    public string? Email    { get; set; }
}

public class MemberDto
{
    public string  UserId   { get; set; } = string.Empty;
    public string  FullName { get; set; } = string.Empty;
    public string? Email    { get; set; }
    public string  Status   { get; set; } = string.Empty;
}