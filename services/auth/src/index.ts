import express from 'express';
import { supabase } from './lib/supabase';
import jwt from 'jsonwebtoken';
import {authorize} from "./middleware/authMiddleware";
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.user) {
        return res.status(401).json({ error: 'authenticated failed' });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

    const role = profile?.role || 'user';

    const token = jwt.sign(
        { sub: data.user.id, role: role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
    );

    res.json({ token, role });
});

// Health check endpoint for DAST scanning
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'auth' });
});

// ============================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ============================================

// Get all users (admin only)
app.get('/admin/users', authorize('admin'), async (req, res) => {
    try {
        // Get users from Supabase auth
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        // Get profiles with roles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, role');

        if (profileError) {
            console.error('Error fetching profiles:', profileError);
        }

        // Merge user data with profiles
        const usersWithRoles = users.map(user => {
            const profile = profiles?.find(p => p.id === user.id);
            return {
                id: user.id,
                email: user.email,
                role: profile?.role || 'user',
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                email_confirmed_at: user.email_confirmed_at
            };
        });

        res.json({ users: usersWithRoles, count: usersWithRoles.length });
    } catch (error) {
        console.error('Admin list users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new user (admin only)
app.post('/admin/users', authorize('admin'), async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters'
            });
        }

        if (role && !['admin', 'user'].includes(role)) {
            return res.status(400).json({
                error: 'Role must be either "admin" or "user"'
            });
        }

        // Create user via Supabase Admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                created_by: 'admin',
                created_via: 'admin_panel'
            }
        });

        if (authError) {
            console.error('Error creating user:', authError);
            return res.status(400).json({
                error: authError.message || 'Failed to create user'
            });
        }

        // Create profile entry with role
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authData.user.id,
                role: role || 'user'
            }]);

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Try to cleanup the auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            return res.status(500).json({
                error: 'Failed to create user profile'
            });
        }

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: authData.user.id,
                email: authData.user.email,
                role: role || 'user',
                created_at: authData.user.created_at
            }
        });
    } catch (error) {
        console.error('Admin create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user (admin only)
app.delete('/admin/users/:id', authorize('admin'), async (req, res) => {
    try {
        const id = req.params.id;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Prevent admin from deleting themselves
        const requestUser = (req as any).user;
        if (requestUser.sub === id) {
            return res.status(403).json({
                error: 'Cannot delete your own account'
            });
        }

        // Delete user from Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Error deleting user:', authError);
            return res.status(500).json({
                error: authError.message || 'Failed to delete user'
            });
        }

        // Delete profile (should cascade automatically, but just in case)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Profile deletion error (non-critical):', profileError);
        }

        res.json({
            message: 'User deleted successfully',
            deleted_id: id
        });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user role (admin only)
app.patch('/admin/users/:id/role', authorize('admin'), async (req, res) => {
    try {
        const id = req.params.id;
        const { role } = req.body;

        if (!id || typeof id !== 'string' || !role) {
            return res.status(400).json({
                error: 'User ID and role are required'
            });
        }

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({
                error: 'Role must be either "admin" or "user"'
            });
        }

        // Update profile role
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating role:', updateError);
            return res.status(500).json({
                error: 'Failed to update user role'
            });
        }

        res.json({
            message: 'User role updated successfully',
            user_id: id,
            new_role: role
        });
    } catch (error) {
        console.error('Admin update role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/dashboard/files', authorize('user'), (req, res) => {
    res.json({ message: "this is your personal document list" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Auth service run successfully: Port Number: ${PORT}`);
});