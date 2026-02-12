import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminPage from "./pages/AdminPage";
import { UserDashboard } from './features/user/UserDashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />

                <Route path="/login" element={<Login />} />

                <Route path="/admin" element={<AdminPage />} />
                <Route path="/dashboard" element={<UserDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;