using StudentManagement.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace StudentManagement.Repositories.Interfaces;

public interface IEnrollmentRepository : IGenericRepository<Enrollment>
{
    // Nếu cần method đặc thù thì thêm sau, hiện tại dùng chung generic là đủ
}