import { useEffect, useState } from 'react';
import { createUser, fetchUsers } from '../../services/adminApi'; // Removed fetchUsers for now to keep it simple
import CreateUserForm  from './CreateUserForm';

// Simplified User interface to match our local backend
interface User {
    id: number;
    email: string;
    role: string;
}

export function AdminDashboard() {
    // Change ID to string because Supabase IDs are UUID strings (e.g., "a1b2-c3d4...")
    interface User {
        id: string; 
        email: string;
        role: string;
    }

    const [users, setUsers] = useState<User[]>([]);
    const [status, setStatus] = useState('');

    // 1. Load users when the page opens
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        }
    };

    const handleCreate = async (email: string, password: string, role: string) => {
        try {
            setStatus('Creating user...');
            await createUser({ email, password, role });
            setStatus('✅ User created successfully!');
            
            // Reload the list to see the new user
            loadUsers(); 
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