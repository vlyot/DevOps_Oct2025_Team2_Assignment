import express, { Request, Response } from 'express';
import { supabase } from './lib/supabase';
import jwt from 'jsonwebtoken';
import {authorize} from "./middleware/authMiddleware";
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';
import { validateEnvironment } from './config/validateEnv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './config/swagger';

// Validate environment variables on startup
validateEnvironment();

const app = express();

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DevSecOps Auth API'
}));

// Swagger JSON spec endpoint
app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: {
        error: 'Too many login attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user and receive JWT token
 *     description: Authenticates a user with email and password, returns JWT token valid for 8 hours. Rate limited to 5 attempts per 15 minutes per IP.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many login attempts (rate limited - 5 attempts per 15 minutes)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *     security: []
 */
app.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(400).json({
            error: 'Email and password are required'
        });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({
            error: 'Invalid email format'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            error: 'Invalid credentials'
        });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.user) {
        return res.status(401).json({ error: 'authenticated failed' });
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

    const role = profile?.role || 'user';

    // JWT secret validation
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
        console.error('CRITICAL: JWT_SECRET must be at least 32 characters long');
        return res.status(500).json({
            error: 'Server configuration error'
        });
    }

    const token = jwt.sign(
        {
            sub: data.user.id,
            role: role,
            email: data.user.email,
            iat: Math.floor(Date.now() / 1000)
        },
        jwtSecret,
        {
            expiresIn: '8h',
            issuer: 'devsecops-auth-service',
            audience: 'devsecops-app'
        }
    );

    res.json({ token, role });
});

// ============================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ============================================

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     description: Retrieves a list of all users with their roles and metadata. Requires admin authorization.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user (admin only)
 *     description: Creates a new user with specified email, password, and role. Requires admin authorization.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     description: Deletes a user by ID. Admin cannot delete their own account. Requires admin authorization.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteUserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - cannot delete own account or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role (admin only)
 *     description: Updates a user's role to either admin or user. Requires admin authorization.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateRoleResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /dashboard/files:
 *   get:
 *     summary: Get user's personal document list
 *     description: Retrieves the authenticated user's personal document list. Requires user or admin authorization.
 *     tags: [User Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's document list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
app.get('/dashboard/files', authorize('user'), (req, res) => {
    res.json({ message: "this is your personal document list" });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the auth service. Used for monitoring and DAST scanning.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *     security: []
 */
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', service: 'auth' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Auth service run successfully: Port Number: ${PORT}`);
});