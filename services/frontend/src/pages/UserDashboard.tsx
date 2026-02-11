import { useEffect, useState } from 'react';
import EmailSubscription from '../components/EmailSubscription';

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
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>User Dashboard 📂</h1>
            <p style={{ color: 'green' }}>Backend Response: {message}</p>

            <EmailSubscription />
        </div>
    );
}