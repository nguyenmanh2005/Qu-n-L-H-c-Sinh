using Microsoft.EntityFrameworkCore;
using StudentManagement.Data;
using StudentManagement.Entities;
using StudentManagement.Repositories.Interfaces;

namespace StudentManagement.Repositories;

public class TeacherRepository : ITeacherRepository
{
    private readonly AppDbContext _context;

    public TeacherRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Teacher?> GetByUserIdAsync(string userId)
    {
        return await _context.Teachers
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId);
    }
}