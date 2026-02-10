import { useState } from 'react';

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
}
