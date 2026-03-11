// src/components/Layout/DashboardLayout.tsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore'; // import store auth (Zustand)

export default function DashboardLayout() {
  const { user, logout } = useAuthStore(); // lấy user và hàm logout từ store
  const role = user?.role || localStorage.getItem('role') || 'Guest'; // fallback
  const location = useLocation(); // để highlight menu active
  const navigate = useNavigate(); // để chuyển hướng sau logout

  // Menu theo role (có thể mở rộng thêm)
  const getMenuItems = () => {
    if (role === 'Admin') {
      return [
        { label: 'Trang chủ', path: '/admin', icon: '🏠' },
        { label: 'Quản lý User', path: '/admin/users', icon: '👥' },
        { label: 'Quản lý Lớp', path: '/admin/classes', icon: '📚' },
        { label: 'Bài tập & Điểm', path: '/admin/grades', icon: '📝' },
        { label: 'Báo cáo', path: '/admin/reports', icon: '📊' },
      ];
    } else if (role === 'Teacher') {
      return [
        { label: 'Trang chủ', path: '/teacher', icon: '🏠' },
        { label: 'Lớp học của tôi', path: '/teacher/classes', icon: '📖' },
        { label: 'Điểm danh', path: '/teacher/attendance', icon: '✅' },
        { label: 'Duyệt đơn khôi phục', path: '/teacher/restore-requests', icon: '🔄' },
      ];
    } else if (role === 'Student') {
      return [
        { label: 'Trang chủ', path: '/student', icon: '🏠' },
        { label: 'Lớp học của tôi', path: '/student/classes', icon: '📚' },
        { label: 'Điểm danh cá nhân', path: '/student/attendance', icon: '📅' },
        { label: 'Gửi đơn khôi phục', path: '/student/restore-request', icon: '📝' },
        { label: 'Bài tập & Điểm', path: '/student/grades', icon: '🏆' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  // Hàm xử lý đăng xuất + chuyển về trang login
  const handleLogout = () => {
    logout(); // gọi hàm logout từ store (xóa token, user, localStorage...)
    
    // Chuyển hướng về trang login ngay lập tức
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">QLSV</h2>
          <p className="text-sm mt-1 opacity-80">
            Xin chào, {user?.username || 'Người dùng'} ({role})
          </p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}  // gọi hàm mới thay vì logout trực tiếp
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <span className="mr-2">🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Quản Lý Sinh Viên
            </h1>
            <div className="text-gray-600">
              {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 px-6">
            <Outlet /> {/* Nội dung các trang con */}
          </div>
        </main>
      </div>
    </div>
  );
}