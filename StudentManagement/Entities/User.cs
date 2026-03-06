using Microsoft.AspNetCore.Identity;

namespace StudentManagement.Entities;

public class User : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
}