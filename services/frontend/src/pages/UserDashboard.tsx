import { useEffect, useState } from 'react';

export default function UserDashboard() {
    const [message, setMessage] = useState('Loading...');

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/dashboard/files', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setMessage(data.message); 
        };
        fetchUserData();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h1>User Dashboard 📂</h1>
            <p style={{ color: 'green' }}>Backend Response: {message}</p>
        </div>
    );
}