using Microsoft.EntityFrameworkCore;
using StudentManagement.Data;
using StudentManagement.Entities;
using StudentManagement.Repositories.Interfaces;

namespace StudentManagement.Repositories;

public class ClassRepository : GenericRepository<Class>, IClassRepository
{
    public ClassRepository(AppDbContext context) : base(context) { }

    public async Task<Class?> GetByCodeAsync(string code)
        => await _dbSet.FirstOrDefaultAsync(c => c.Code == code);

    public async Task<Class?> GetWithTeacherAsync(int id)
        => await _dbSet.Include(c => c.Teacher).FirstOrDefaultAsync(c => c.Id == id);
}