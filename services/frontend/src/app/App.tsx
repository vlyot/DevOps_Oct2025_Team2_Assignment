import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from '../features/admin/AdminDashboard';

export default function App() {
    return (
        <Routes>
            {/* Temp */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
    );
}
