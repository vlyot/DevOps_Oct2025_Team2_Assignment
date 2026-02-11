export interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: 'admin' | 'user';
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login: string | null;
}