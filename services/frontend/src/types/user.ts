export interface User {
    id: string;
    email: string;
    password_hash: string;
    full_name: string | null;
    role: 'ADMIN' | 'USER';
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login: string | null;
}