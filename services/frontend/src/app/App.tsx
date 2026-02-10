import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import Login from '../pages/Login';
import UserDashboard from '../pages/UserDashboard';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* User routes - require user role */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute requiredRole="user">
                        <UserDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Admin routes - require admin role */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
