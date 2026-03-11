// src/routes/index.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import Login from '@/features/auth/Login';
import Register from '@/features/auth/Register';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';

// Các dashboard theo role
import StudentDashboard from '@/features/student/StudentDashboard';
import TeacherDashboard from '@/features/teacher/TeacherDashboard';

// Admin pages
import AdminDashboard from '@/features/admin/AdminDashboard';
import UserManagement from '@/features/admin/UserManagement';
import ClassManagement from '@/features/admin/ClassManagement';
import AdminReports from '@/features/admin/AdminReports';
import AdminGrades from '@/features/admin/AdminGrades';        // ← MỚI

// Student pages
import StudentGrades from '@/features/student/Studentgrades';  // ← MỚI

const router = createBrowserRouter([
  // Trang công khai (không cần auth)
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/teacher', element: <TeacherDashboard /> },
  { path: '/student', element: <StudentDashboard /> },

  // Root path: redirect về login nếu truy cập /
  { path: '/', element: <Navigate to="/login" replace /> },

  // Protected routes (yêu cầu đăng nhập)
  {
    element: <ProtectedRoute allowedRoles={['Admin', 'Teacher', 'Student']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Student
          { path: '/student', element: <StudentDashboard /> },
          { path: '/student/grades', element: <StudentGrades /> },  // ← MỚI

          // Teacher
          { path: '/teacher', element: <TeacherDashboard /> },

          // Admin routes (chỉ Admin truy cập được)
          {
            path: '/admin',
            element: <ProtectedRoute allowedRoles={['Admin']} />,
            children: [
              // Trang tổng quan Admin
              {
                index: true,
                element: <AdminDashboard />,
              },

              // Quản lý người dùng
              { path: 'users', element: <UserManagement /> },

              // Quản lý lớp học
              { path: 'classes', element: <ClassManagement /> },

              // Báo cáo
              { path: 'reports', element: <AdminReports /> },

              // Bài tập & Điểm  ← MỚI
              { path: 'grades', element: <AdminGrades /> },
            ],
          },
        ],
      },
    ],
  },

  // Trang lỗi
  { path: '/unauthorized', element: <div>Bạn không có quyền truy cập trang này</div> },
  { path: '*', element: <div>404 - Không tìm thấy trang</div> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}