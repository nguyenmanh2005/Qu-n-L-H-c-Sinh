namespace StudentManagement.DTOs;




public class UpdateUserDto
{
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public string? UserName { get; set; }
    public bool? EmailConfirmed { get; set; }        
    public string? PhoneNumber { get; set; }
    public bool? PhoneNumberConfirmed { get; set; }  
}
