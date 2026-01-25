import { useState } from 'react';

interface Props {
    onCreate: (
        email: string,
        full_name: string | undefined,
        role: 'ADMIN' | 'USER'
    ) => void;
}

export function CreateUserForm({ onCreate }: Props) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        onCreate(email, fullName || undefined, role);
        setEmail('');
        setFullName('');
        setRole('USER');
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
            placeholder="Full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
        />

        <select
            value={role}
            onChange={e => setRole(e.target.value as 'ADMIN' | 'USER')}
        >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
        </select>

        <button type="submit">Create</button>
        </form>
    );
}
