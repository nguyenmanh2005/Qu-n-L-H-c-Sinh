using Microsoft.AspNetCore.Identity;
using StudentManagement.Entities;
using StudentManagement.Repositories.Interfaces;

namespace StudentManagement.Repositories;

public class UserRepository : IUserRepository
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UserRepository(UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public IQueryable<User> Users => _userManager.Users;

    public Task<User?> FindByIdAsync(string id) => _userManager.FindByIdAsync(id);
    public Task<User?> FindByNameAsync(string username) => _userManager.FindByNameAsync(username);
    public Task<User?> FindByEmailAsync(string email) => _userManager.FindByEmailAsync(email);
    public Task<IdentityResult> CreateAsync(User user, string password) => _userManager.CreateAsync(user, password);
    public Task<IdentityResult> UpdateAsync(User user) => _userManager.UpdateAsync(user);
    public Task<IdentityResult> DeleteAsync(User user) => _userManager.DeleteAsync(user);
    public Task<IdentityResult> AddToRoleAsync(User user, string role) => _userManager.AddToRoleAsync(user, role);
    public Task<IdentityResult> RemoveFromRolesAsync(User user, IEnumerable<string> roles) => _userManager.RemoveFromRolesAsync(user, roles);
    public Task<IList<string>> GetRolesAsync(User user) => _userManager.GetRolesAsync(user);
    public Task UpdateSecurityStampAsync(User user) => _userManager.UpdateSecurityStampAsync(user);
    public Task<bool> RoleExistsAsync(string roleName) => _roleManager.RoleExistsAsync(roleName);
}