import express, { Request, Response } from 'express';
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

app.get('/admin/users', authorize('admin'), (req, res) => {
    res.json({ message: "sensitive data for admin only" });
});

app.get('/dashboard/files', authorize('user'), (req, res) => {
    res.json({ message: "this is your personal document list" });
});

// Health check endpoint for DAST scanning
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', service: 'auth' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Auth service run successfully: Port Number: ${PORT}`);
});