import { useEffect, useState } from 'react';
import type { User } from '../../types/user';
import { fetchUsers, createUser, deactivateUser } from '../../services/adminApi';
import { CreateUserForm } from './CreateUserForm';
import { UserTable } from './UserTable';
import '../../admin.css';


export function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateOverlay, setShowCreateOverlay] = useState(false);

    useEffect(() => {
        init();
    }, []);

    async function init() {
    try {
        setLoading(true);
        const data = await fetchUsers();
        setUsers(data);
    } catch (err) {
        // console.error(err);
        setError('Unable to load users');
    } finally {
        setLoading(false);
    }
    }

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

    async function handleCreate(payload: {
        email: string;
        full_name?: string;
        password: string;
        role: 'admin' | 'user';
    }) {
        await createUser(payload);
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
    
    if (loading) return <p className="loading">Loading users...</p>;
    const activeUsers = users.filter(u => u.is_active);
    const normalUsers = activeUsers.filter(u => u.role === 'user').length;
    const adminUsers = activeUsers.filter(u => u.role === 'admin').length;
    const totalUsers = activeUsers.length;
    
    return (
        <div className="main-page">
            {error && <div className="error">Unable to load users</div>}
            {showCreateOverlay && (
                <div className="overlay">
                <div className="overlay-content">
                    <button
                        className="close-btn"
                        onClick={() => setShowCreateOverlay(false)}
                    >
                    x
                    </button>
                    <CreateUserForm onCreate={handleCreate} onClose={() => setShowCreateOverlay(false)} />
                </div>
                </div>
            )}
            {/* Header row */}
            <div className="admin-header">
            <h1>Admin Dashboard</h1>

            <div className="stats">
                <div className="stat-card">
                <span className="stat-value">{normalUsers}</span>
                <span className="stat-label">Users</span>
                </div>

                <div className="stat-card">
                <span className="stat-value">{adminUsers}</span>
                <span className="stat-label">Admins</span>
                </div>

                <div className="stat-card">
                <span className="stat-value">{totalUsers}</span>
                <span className="stat-label">Total</span>
                </div>
            </div>
            </div>

            {/* Table section */}
            <div className="table-section">
            <div className="table-header">
                <h2>Users</h2>
                <button onClick={() => setShowCreateOverlay(true)}>Create User</button>
            </div>

            {!error && (
                <UserTable users={activeUsers} onDeactivate={handleDeactivate} />
            )}
            </div>
        </div>
    );
}
