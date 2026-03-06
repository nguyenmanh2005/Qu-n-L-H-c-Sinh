using StudentManagement.Entities;
using System.Threading.Tasks;

namespace StudentManagement.Repositories.Interfaces;

public interface IClassRepository : IGenericRepository<Class>
{
    Task<Class?> GetByCodeAsync(string code);
    Task<Class?> GetWithTeacherAsync(int id);
}