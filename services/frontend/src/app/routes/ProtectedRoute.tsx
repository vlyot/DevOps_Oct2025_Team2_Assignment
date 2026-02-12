import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    // TEMPORARY: Just return the page so we can work!
    return <>{children}</>;
}
