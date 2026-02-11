import { useEffect, useState } from 'react';
import { fetchUsers, createUser, deleteUser } from '../../services/adminApi';
import { CreateUserForm } from './CreateUserForm';
import { UserTable } from './UserTable';

interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
}

export function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchUsers();
            setUsers(data);
        } catch (err) {
            setError('Unable to load users');
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(
        email: string,
        password: string,
        role: 'admin' | 'user'
    ) {
        try {
            await createUser({ email, password, role });
            await loadUsers();
        } catch (err) {
            console.error('Error creating user:', err);
            alert(err instanceof Error ? err.message : 'Failed to create user');
        }
    }

    async function handleDelete(userId: string) {
        try {
            await deleteUser(userId);
            // Remove from local state immediately
            setUsers(users => users.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Error deleting user:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete user');
        }
    }

    if (loading) return <p>Loading users...</p>;

    return (
        <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <h1>Admin Dashboard</h1>

            <CreateUserForm onCreate={handleCreate} />
            {!error && (
                <UserTable
                    users={users}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
