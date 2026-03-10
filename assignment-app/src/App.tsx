// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/features/LoginPage';
import StudentDashboard from '@/features/student/StudentDashboard';
import TeacherAssignmentDashboard from '@/features/teacher/TeacherAssignmentDashboard';
import AdminAssignmentDashboard from '@/features/admin/AdminAssignmentDashboard';
import { useAuthStore } from '@/store/authStore';

function RequireAuth({ children, role }: { children: React.ReactNode; role: string }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student" element={
          <RequireAuth role="Student"><StudentDashboard /></RequireAuth>
        } />
        <Route path="/teacher" element={
          <RequireAuth role="Teacher"><TeacherAssignmentDashboard /></RequireAuth>
        } />
        <Route path="/admin" element={
          <RequireAuth role="Admin"><AdminAssignmentDashboard /></RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
