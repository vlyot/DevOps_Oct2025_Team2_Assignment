import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

// easy mock components for protected routes
const AdminDashboard = () => <h1>Admin Area 🛡️ (Access Granted)</h1>;
const UserDashboard = () => <h1>User Area 📂 (My Files)</h1>;

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />

                <Route path="/login" element={<Login />} />

                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<UserDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;