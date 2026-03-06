using Microsoft.EntityFrameworkCore;
using StudentManagement.Data;
using StudentManagement.Entities;
using StudentManagement.Repositories.Interfaces;

namespace StudentManagement.Repositories;

public class StudentRepository : IStudentRepository
{
    private readonly AppDbContext _db;

    public StudentRepository(AppDbContext db)
    {
        _db = db;
    }

    // ── Enrollment ───────────────────────────────────────────────────────

    public Task<List<Enrollment>> GetEnrollmentsByStudentAsync(string studentId)
        => _db.Set<Enrollment>()
              .Where(e => e.StudentId == studentId)
              .ToListAsync();

    public Task<List<Enrollment>> GetEnrollmentsByClassAsync(int classId)
        => _db.Set<Enrollment>()
              .Where(e => e.ClassId == classId)
              .ToListAsync();

    public Task<Enrollment?> GetEnrollmentAsync(string studentId, int classId)
        => Task.FromResult(
               _db.Set<Enrollment>()
                  .FirstOrDefault(e => e.StudentId == studentId && e.ClassId == classId));

    public async Task AddEnrollmentAsync(Enrollment enrollment)
        => await _db.Set<Enrollment>().AddAsync(enrollment);

    // ── Class ─────────────────────────────────────────────────────────────

    public Task<Class?> GetClassByIdAsync(int classId)
        => Task.FromResult(_db.Classes.FirstOrDefault(c => c.Id == classId));

    public Task<Class?> GetClassByCodeAsync(string code)
        => Task.FromResult(_db.Classes.FirstOrDefault(c => c.Code == code.ToUpper()));

    // ── Attendance ────────────────────────────────────────────────────────

    public Task<List<Attendance>> GetAttendanceByStudentAsync(string studentId)
        => _db.Set<Attendance>()
              .Where(a => a.StudentId == studentId)
              .ToListAsync();

    public Task<List<Attendance>> GetAttendanceByStudentAndMonthAsync(
        string studentId, int year, int month)
    {
        var from = new DateTime(year, month, 1);
        var to   = from.AddMonths(1);
        return _db.Set<Attendance>()
                  .Where(a => a.StudentId == studentId && a.Date >= from && a.Date < to)
                  .ToListAsync();
    }

    public Task<Attendance?> GetAttendanceByIdAsync(int id, string studentId)
        => Task.FromResult(
               _db.Set<Attendance>().FirstOrDefault(a => a.Id == id && a.StudentId == studentId));

    public Task<Attendance?> GetAttendanceByDateAsync(string studentId, int classId, DateTime date)
    {
        var dayStart = date.Date;
        var dayEnd   = dayStart.AddDays(1);
        return Task.FromResult(
               _db.Set<Attendance>()
                  .FirstOrDefault(a => a.StudentId == studentId
                                    && a.ClassId   == classId
                                    && a.Date      >= dayStart
                                    && a.Date       < dayEnd));
    }

    public async Task AddAttendanceAsync(Attendance attendance)
        => await _db.Set<Attendance>().AddAsync(attendance);

    // ── Save ──────────────────────────────────────────────────────────────

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}