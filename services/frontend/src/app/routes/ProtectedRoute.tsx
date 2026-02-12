import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // 1. If not logged in at all, kick to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. If a specific role is required (like 'admin') but user doesn't have it
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // If they are a normal user trying to see admin, send to user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // 3. If everything is fine, show the page
  // We use <Outlet /> because in App.tsx, this is a parent route
  return <Outlet />;
};
