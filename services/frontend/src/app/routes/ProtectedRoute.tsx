import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole
}: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // Check if authentication is required and user is not authenticated
  if (requireAuth && !token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if specific role is required
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate page based on current role
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'user') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
