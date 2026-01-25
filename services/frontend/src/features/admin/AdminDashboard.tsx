import { useEffect, useState } from 'react';
import type { User } from '../../types/user';
import { fetchUsers, createUser, deactivateUser } from '../../services/adminApi';
import { CreateUserForm } from './CreateUserForm';
import { UserTable } from './UserTable';

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
            const data = await fetchUsers();
            setUsers(data);
        } catch {
            setError('Unable to load users');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(
        email: string,
        full_name: string | undefined,
        role: 'ADMIN' | 'USER'
    ) {
        await createUser({ email, full_name, role });
        await loadUsers();
    }

    async function handleDeactivate(userId: string) {
        await deactivateUser(userId);
        setUsers(users =>
        users.map(u =>
            u.id === userId ? { ...u, is_active: false } : u
        )
        );
    }

    if (loading) return <p>Loading users...</p>;
    return (
        <div>
            {error && <div>Unable to load users?</div>}
            <h1>Admin Dashboard</h1>

            <CreateUserForm onCreate={handleCreate} />
            {!error &&
                <UserTable
                    users={users}
                    onDeactivate={handleDeactivate}
                />
            }
        </div>
    );
}
