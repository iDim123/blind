import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@blind/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: UserRole;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { token, role: userRole } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== role) {
    if (userRole === UserRole.ADMIN) return <Navigate to="/admin/games" replace />;
    return <Navigate to="/play" replace />;
  }

  return <>{children}</>;
}