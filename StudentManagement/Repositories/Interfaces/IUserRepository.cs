using Microsoft.AspNetCore.Identity;
using StudentManagement.Entities;
using System.Threading.Tasks;

namespace StudentManagement.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> FindByIdAsync(string id);
    Task<User?> FindByNameAsync(string username);
    Task<User?> FindByEmailAsync(string email);
    Task<IdentityResult> CreateAsync(User user, string password);
    Task<IdentityResult> UpdateAsync(User user);
    Task<IdentityResult> DeleteAsync(User user);
    Task<IdentityResult> AddToRoleAsync(User user, string role);
    Task<IdentityResult> RemoveFromRolesAsync(User user, IEnumerable<string> roles);
    Task<IList<string>> GetRolesAsync(User user);
    Task UpdateSecurityStampAsync(User user);
    Task<bool> RoleExistsAsync(string roleName);   // ← thêm dòng này
    IQueryable<User> Users { get; }
}