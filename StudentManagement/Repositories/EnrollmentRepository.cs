using StudentManagement.Data;
using StudentManagement.Entities;
using StudentManagement.Repositories.Interfaces;

namespace StudentManagement.Repositories;

public class EnrollmentRepository : GenericRepository<Enrollment>, IEnrollmentRepository
{
    public EnrollmentRepository(AppDbContext context) : base(context)
    {
    }
}