import { useState } from 'react';
import lock_icon from '../../assets/lock.png';
import gmail_icon from '../../assets/gmail.png';
import user_icon from "../../assets/user.png";

interface Props {
  onCreate: (payload: {
    email: string;
    full_name?: string;
    password: string;
    role: 'admin' | 'user';
  }) => void;
  onClose: () => void;
}

export function CreateUserForm({ onCreate, onClose }: Props) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!password) {
            alert('Password is required');
            return;
        }

        onCreate({
            email,
            full_name: fullName || undefined,
            password,
            role,
        });

        // Reset form
        setEmail('');
        setFullName('');
        setPassword('');
        setRole('user');

        onClose();
    }

    return (
        <form className="create-user-form" onSubmit={submit}>
            <h2>Create a new user</h2>
            <label>Username</label>
            <div style={{ position: 'relative' }}>
                <span className="input-icon"><img src={user_icon} alt="user" /></span>
                <input
                    required
                    type="text"
                    placeholder="Username"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                />
            </div>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
                <span className="input-icon"><img src={lock_icon} alt="lock" /></span>
                <input
                    required
                    type="password"
                    placeholder="User Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>
            <label>Email</label>
            <div style={{ position: 'relative' }}>
                <span className="input-icon"><img src={gmail_icon} alt="email" /></span>
                <input
                    required
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>
            <label>Role</label>
            <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'user')}
            >
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                A confirmation email will be sent when creating a user via this form.
            </p>

            <button type="submit">Create user</button>
        </form>
    );
}
