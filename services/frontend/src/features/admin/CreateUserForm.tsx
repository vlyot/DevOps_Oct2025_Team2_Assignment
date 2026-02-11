import { useState } from 'react';
import { createUser } from '../../services/adminApi';

export default function CreateUserForm({ onSuccess }: { onSuccess?: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Creating...');

        try {
            await createUser({ email, password, role });
            setStatus('✅ User created successfully!');
            setEmail('');
            setPassword('');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            setStatus(`❌ Error: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>Create New User</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ padding: '8px' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ padding: '8px' }}
                />
                <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    style={{ padding: '8px' }}
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white' }}>
                    Create User
                </button>
            </form>
            {status && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
        </div>
    );
}























/*import { useState } from 'react';

interface Props {
    onCreate: (
        email: string,
        password: string,
        role: 'admin' | 'user'
    ) => void;
}

export function CreateUserForm({ onCreate }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        onCreate(email, password, role);
        setEmail('');
        setPassword('');
        setRole('user');
    }

    return (
        <form onSubmit={submit}>
            <h2>Create User</h2>

            <input
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />

            <input
                required
                type="password"
                placeholder="Password (min 6 characters)"
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'user')}
            >
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>

            <button type="submit">Create</button>
        </form>
    );
}*/
