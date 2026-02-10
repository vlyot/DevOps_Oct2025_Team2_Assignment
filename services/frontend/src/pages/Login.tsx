import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);

                navigate(data.role === 'admin' ? '/admin' : '/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection error: Is Auth Service running?');
        }
    };

    const fetchFiles = async () => {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:3000/dashboard/files', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log(data.message); // "this is your personal document list"
    };


    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <h2>🔐 DevSecOps Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px' }}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
                    Sign In
                </button>
            </form>
        </div>
    );
}