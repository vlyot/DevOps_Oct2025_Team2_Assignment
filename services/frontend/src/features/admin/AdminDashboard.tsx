import { useEffect, useState } from 'react';
import { createUser } from '../../services/adminApi'; // Removed fetchUsers for now to keep it simple
import CreateUserForm  from './CreateUserForm';

// Simplified User interface to match our local backend
interface User {
    id: number;
    email: string;
    role: string;
}

export function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [status, setStatus] = useState('');

    // Function to handle the creation logic passed to the form
    const handleCreate = async (email: string, password: string, role: string) => {
        try {
            setStatus('Creating user...');
            const newUser = await createUser({ email, password, role });
            
            // Immediately update the local list so you can see the result
            setUsers(prev => [...prev, newUser]);
            setStatus('✅ User created successfully!');
        } catch (err: any) {
            console.error('Error creating user:', err);
            setStatus(`❌ Error: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Admin Control Panel</h1>
            <p>Welcome to the simplified admin area. You can create users here.</p>
            <hr style={{ margin: '20px 0' }} />

            {/* Render the form and pass our handleCreate function */}
            <CreateUserForm onSuccess={() => console.log("Refresh triggered")} />

            <div style={{ marginTop: '40px' }}>
                <h3>Current Users (This Session)</h3>
                {users.length === 0 ? (
                    <p>No users created yet in this session.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.id}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.email}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.role}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            {status && <p style={{ marginTop: '20px', fontStyle: 'italic' }}>{status}</p>}
        </div>
    );
}