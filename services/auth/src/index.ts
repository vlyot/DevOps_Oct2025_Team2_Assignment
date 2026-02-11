import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. Load environment variables (so PORT works)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Allow the Frontend to talk to us (CORS)
app.use(cors()); 
app.use(express.json());

// 3. A Simple "Mock" User Database
const MOCK_USER = {
    email: "test@example.com",
    password: "password123",
    role: "user"
};

// 4. The Login Route (No Supabase, just simple logic)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`); // This helps us see it in the terminal

    if (email === MOCK_USER.email && password === MOCK_USER.password) {
        // Success! Return a fake token
        return res.status(200).json({
            token: "fake-jwt-token-for-testing",
            role: MOCK_USER.role,
            message: "Login successful!"
        });
    }

    // Fail
    return res.status(401).json({ error: "Invalid credentials" });
});

// 5. Start the Server
app.listen(PORT, () => {
    console.log(`✅ Auth Service is running on http://localhost:${PORT}`);
});