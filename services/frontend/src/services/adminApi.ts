import type { User } from '../types/user';
import { supabase } from '../../supabaseClient.ts';

interface Todo {
    id: number;
    task: string;
    completed: boolean;
}


// Fetch all users
export async function fetchUsers(): Promise<User[]> {
    const { data, error } = await supabase.from<'users', User>('users').select('*');
    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data || [];
}

const DEFAULT_PASSWORD_HASH = 'qwertyuiop';

// Create new user
export async function createUser(payload: {
    email: string;
    full_name?: string;
    role: 'ADMIN' | 'USER';
}): Promise<void> {
    const { error } = await supabase.from('users').insert([
        {
            email: payload.email,
            full_name: payload.full_name || null,
            role: payload.role,
            password_hash: DEFAULT_PASSWORD_HASH,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: null
        },
    ]);



    if (error) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create user');
    }
}


// Soft delete user
export async function deactivateUser(userId: string): Promise<void> {
    const { error } = await supabase
        .from('users')
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) {
        console.error('Error deactivating user:', error);
        throw new Error('Failed to deactivate user');
    }
}



// Fetch todos
export async function fetchTodos(): Promise<Todo[]> {
    const { data, error } = await supabase.from<'todos', Todo>('todos').select('*');

    if (error) {
        console.error('Error fetching todos:', error);
        return [];
    }

    return data || [];
}
