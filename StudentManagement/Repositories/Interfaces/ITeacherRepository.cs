using StudentManagement.Entities;

namespace StudentManagement.Repositories.Interfaces;

public interface ITeacherRepository
{
    Task<Teacher?> GetByUserIdAsync(string userId);
}