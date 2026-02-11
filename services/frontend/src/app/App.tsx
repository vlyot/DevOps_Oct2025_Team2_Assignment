import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from '../features/admin/AdminDashboard'; // Ensure this matches your export (named vs default)
import Login from '../pages/Login';
import UserDashboard from '../pages/UserDashboard';

export default function App() {
    return (
        <Routes>
            {/* 1. Default route redirects to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 2. Login Page - Always accessible */}
            <Route path="/login" element={<Login />} />

            {/* 3. User Dashboard - Removed ProtectedRoute for testing */}
            <Route path="/dashboard" element={<UserDashboard />} />

            {/* 4. Admin Dashboard - Removed ProtectedRoute for testing */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* 5. Catch-all: redirect any unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}