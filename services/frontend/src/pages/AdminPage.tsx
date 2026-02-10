import { useEffect, useState } from 'react';

export default function AdminPage() {
    const [message, setMessage] = useState('Loading...');

    useEffect(() => {
        const fetchAdminData = async () => {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setMessage(data.message);
        };
        fetchAdminData();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h1>Admin Dashboard 🛡️</h1>
            <p style={{ color: 'blue' }}>Backend Response: {message}</p>
        </div>
    );
}