using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentManagement.Entities;

namespace StudentManagement.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<User>>();
        var db          = services.GetRequiredService<AppDbContext>();
        var logger      = services.GetRequiredService<ILogger<Program>>();

        try
        {
            await SeedRolesAsync(roleManager);
            await SeedAdminAsync(userManager);
            await SyncSchemaAsync(db);
            await SyncTeachersStudentsAsync(userManager, db);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during seed roles, admin or schema sync");
        }
    }

    // ── 1. Tạo Roles ────────────────────────────────────────────────────
    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        string[] roles = { "Admin", "Teacher", "Student" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    // ── 2. Tạo tài khoản Admin mặc định ─────────────────────────────────
    private static async Task SeedAdminAsync(UserManager<User> userManager)
    {
        var adminEmail = "admin@gmail.com";
        var adminUser  = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            var newAdmin = new User
            {
                UserName       = adminEmail,
                Email          = adminEmail,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(newAdmin, "Admin@123");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(newAdmin, "Admin");
        }
    }

    // ── 3. Sync Schema (tạo bảng/cột nếu thiếu) ─────────────────────────
    private static async Task SyncSchemaAsync(AppDbContext db)
    {
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
IF NOT EXISTS(SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Teachers' AND COLUMN_NAME='UserId')
    ALTER TABLE Teachers ADD UserId NVARCHAR(450) NULL;

IF NOT EXISTS(SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Students' AND COLUMN_NAME='UserId')
    ALTER TABLE Students ADD UserId NVARCHAR(450) NULL;

IF NOT EXISTS(SELECT * FROM SYSOBJECTS WHERE NAME='Attendances' AND XTYPE='U')
BEGIN
    CREATE TABLE Attendances (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        StudentId NVARCHAR(450) NULL,
        ClassId INT NULL,
        [Date] DATETIME2 NULL,
        Present BIT NULL,
        RestoreRequested BIT NULL,
        RestoreReason NVARCHAR(MAX) NULL,
        RestoreStatus NVARCHAR(50) NULL,
        RequestDate DATETIME2 NULL,
        ReviewedDate DATETIME2 NULL,
        ReviewedBy NVARCHAR(450) NULL
    );
END";
        await cmd.ExecuteNonQueryAsync();
    }

    // ── 4. Sync Teachers và Students tables ──────────────────────────────
    private static async Task SyncTeachersStudentsAsync(
        UserManager<User> userManager,
        AppDbContext db)
    {
        var teacherUsers = await userManager.GetUsersInRoleAsync("Teacher");
        foreach (var u in teacherUsers)
        {
            if (!db.Teachers.Any(t => t.UserId == u.Id))
                db.Teachers.Add(new Teacher
                {
                    FullName = u.FullName ?? u.UserName ?? u.Email ?? "Unknown",
                    UserId   = u.Id
                });
        }

        var studentUsers = await userManager.GetUsersInRoleAsync("Student");
        foreach (var u in studentUsers)
        {
            if (!db.Students.Any(s => s.UserId == u.Id))
                db.Students.Add(new Student
                {
                    FullName = u.FullName ?? u.UserName ?? u.Email ?? "Unknown",
                    UserId   = u.Id
                });
        }

        await db.SaveChangesAsync();
    }
}