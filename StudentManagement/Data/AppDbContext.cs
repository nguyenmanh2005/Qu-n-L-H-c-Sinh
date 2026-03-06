using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Entities;

namespace StudentManagement.Data;

public class AppDbContext : IdentityDbContext<User>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Student> Students { get; set; }
    public DbSet<Teacher> Teachers { get; set; }
    // AppDbContext.cs
public DbSet<Class> Classes { get; set; }
public DbSet<Course> Courses { get; set; }
public DbSet<Enrollment> Enrollments { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
}