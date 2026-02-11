import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase with the ANON key for simplicity
const supabase = createClient(
    process.env.SUPABASE_URL || '', 
    process.env.SUPABASE_ANON_KEY || ''
);

const app = express();
app.use(cors());
app.use(express.json());

// SIMPLE LOGIN: Just checks email and password
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) return res.status(401).json({ error: error.message });

    // We send a FAKE token so the frontend doesn't crash, 
    // but we aren't actually validating it yet.
    return res.status(200).json({
        token: "simple-test-token", 
        role: data.user?.user_metadata?.role || 'admin',
        message: "Logged in!"
    });
});

// SIMPLE CREATE: No JWT check needed to run this
app.post('/admin/users', async (req, res) => {
    const { email, password, role } = req.body;

    // We use the basic signup method which is easier to test
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { role: role || 'user' }
        }
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({
        id: data.user?.id,
        email: email,
        role: role
    });
});

app.listen(3000, () => console.log("🚀 Back to basics on port 3000"));