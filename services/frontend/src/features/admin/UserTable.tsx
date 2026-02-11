import type { User } from '../../types/user';

interface Props {
    users: User[];
    onDeactivate: (id: string) => void;
}

export function UserTable({ users, onDeactivate }: Props) {
    return (
        <table>
        <thead>
            <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
            </tr>
        </thead>

        <tbody>
            {users.map(user => (
            <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.full_name ?? '-'}</td>
                <td>{user.role}</td>
                <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                {user.is_active && user.role !== 'ADMIN' && (
                    <button onClick={() => onDeactivate(user.id)}>
                    Deactivate
                    </button>
                )}
                </td>
            </tr>
            ))}
        </tbody>
        </table>
    );
}
