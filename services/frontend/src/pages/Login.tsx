import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('test@example.com'); // Pre-fill for easier testing
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            console.log("Sending login request...");
            
            // Ensure we use the correct URL. 
            // If VITE_API_URL is not set, fallback to localhost:3000
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Login success:", data);
                // Save the fake token so the app "thinks" we are logged in
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                
                // Navigate to dashboard
                navigate('/admin');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Connection refused. Is the backend running?');
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>Step 1: Simple Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    style={{ padding: '10px' }}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    style={{ padding: '10px' }}
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white' }}>
                    Test Login
                </button>
            </form>
        </div>
    );
}