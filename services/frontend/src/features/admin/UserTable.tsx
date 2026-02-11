interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
}

interface Props {
    users: User[];
    onDelete: (id: string) => void;
}

export function UserTable({ users, onDelete }: Props) {
    return (
        <table>
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Last Sign In</th>
                    <th>Action</th>
                </tr>
            </thead>

            <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                        <td>
                            <button onClick={() => onDelete(user.id)}>
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
