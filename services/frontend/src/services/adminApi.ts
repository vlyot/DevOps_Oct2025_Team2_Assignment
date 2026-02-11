import type { User } from '../types/user';
import { supabase } from '../../supabaseClient';

// Fetch all users
export async function fetchUsers(): Promise<User[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        // console.error('Error fetching users:', error);
        return [];
    }

    return data as User[] ?? [];
}

export async function createUser(payload: {
    email: string;
    full_name?: string;
    password: string;
    role: 'admin' | 'user';
    }): Promise<void> {
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        });

        if (authError || !authData.user) {
        throw new Error('Failed to create auth user');
        }

        const userId = authData.user.id;

        const { error: insertError } = await supabase
        .from('users')
        .insert({
            id: userId,
            email: payload.email,
            full_name: payload.full_name ?? null,
            role: payload.role,
            is_active: true,
        });
        if (insertError) {
            console.log(insertError)
            throw new Error('Failed to create user in public.users');
        }
    } catch (err) {
        throw err;
    }
}

// Deactive user
// Currently, deleting user from this side of code requires supabase paid plan, so this is the current alternative
export async function deactivateUser(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        is_active: false,
      })
      .eq('id', userId)
      .select('id, is_active');
    
    if (error) {
      throw new Error('Failed to deactivate user');
    }
    console.log("User " + userId + " deleted")
    console.log(data)
  } catch (err) {
    throw err;
  }
}
