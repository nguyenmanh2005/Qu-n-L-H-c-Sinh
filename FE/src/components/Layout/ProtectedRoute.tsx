import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

type Props = {
  allowedRoles: string[];
};

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}