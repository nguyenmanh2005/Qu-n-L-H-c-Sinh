using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StudentManagement.Data;
using StudentManagement.Entities;
using StudentManagement.Services;
using StudentManagement.Services.Interfaces;
using StudentManagement.Repositories;
using StudentManagement.Repositories.Interfaces;
using System.Text;
using System.Security.Claims;
using System.Reflection;
using System.IO;
using StudentManagement.Repositories;
using StudentManagement.Repositories.Interfaces;
using StudentManagement.Services;
using StudentManagement.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ================= DATABASE =================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ================= IDENTITY =================
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.User.AllowedUserNameCharacters = null;
    options.User.RequireUniqueEmail = true;

    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ================= AUTHENTICATION =================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme             = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = false,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey         = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name
    };

    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsync("{\"error\": \"Unauthorized - Vui lòng đăng nhập lại\"}");
        },
        OnForbidden = context =>
        {
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsync("{\"error\": \"Forbidden - Không đủ quyền (Admin)\"}");
        }
    };
});

// Tắt redirect cookie của Identity
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        context.Response.ContentType = "application/json";
        context.Response.WriteAsync("{\"error\": \"Unauthorized\"}");
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        context.Response.ContentType = "application/json";
        context.Response.WriteAsync("{\"error\": \"Forbidden\"}");
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// ================= SWAGGER =================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "StudentManagement API",
        Version = "v1",
        Description = "API quản lý sinh viên, giáo viên, admin"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token theo format: Bearer {your token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) options.IncludeXmlComments(xmlPath);
});

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy.WithOrigins("http://127.0.0.1:5500", "http://localhost:5500")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());

    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

// ================= REPOSITORIES =================
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IClassRepository, ClassRepository>();
builder.Services.AddScoped<IEnrollmentRepository, EnrollmentRepository>();

// ================= SERVICES =================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IAdminClassService, AdminClassService>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IStudentService,    StudentService>();
// builder.Services.AddScoped<ITeacherRepository, TeacherRepository>();
// builder.Services.AddScoped<ITeacherService,    TeacherService>();

// ================= BUILD =================
var app = builder.Build();

// ================= MIDDLEWARE =================
app.UseCors("AllowAll");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "StudentManagement API v1");
    c.RoutePrefix = "swagger";
});

// app.UseHttpsRedirection(); // Tắt khi dev với HTTP
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().RequireCors("AllowAll");

// ================= SEED ROLES + ADMIN + SCHEMA =================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = services.GetRequiredService<UserManager<User>>();
    var db = services.GetRequiredService<AppDbContext>();
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        string[] roles = { "Admin", "Teacher", "Student" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        var adminEmail = "admin@gmail.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            var newAdmin = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(newAdmin, "Admin@123");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(newAdmin, "Admin");
        }

        // Schema sync
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();
        using (var cmd = conn.CreateCommand())
        {
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

        // Sync users to Teachers/Students tables
        var teacherUsers = await userManager.GetUsersInRoleAsync("Teacher");
        foreach (var u in teacherUsers)
        {
            if (!db.Teachers.Any(t => t.UserId == u.Id))
                db.Teachers.Add(new Teacher { FullName = u.FullName ?? u.UserName ?? u.Email ?? "Unknown", UserId = u.Id });
        }

        var studentUsers = await userManager.GetUsersInRoleAsync("Student");
        foreach (var u in studentUsers)
        {
            if (!db.Students.Any(s => s.UserId == u.Id))
                db.Students.Add(new Student { FullName = u.FullName ?? u.UserName ?? u.Email ?? "Unknown", UserId = u.Id });
        }

        await db.SaveChangesAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error during seed roles, admin or schema sync");
    }
}

app.Run();