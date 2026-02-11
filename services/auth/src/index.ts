import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. The "Database" (Just an array for now)
let users = [
    {
        id: 1,
        email: "admin@example.com",
        password: "password123",
        role: "admin" // We need this to be 'admin' to see the dashboard
    }
];

// 2. Login Route (Checks the array)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        return res.status(200).json({
            token: "fake-jwt-token",
            role: user.role,
            message: "Login successful!"
        });
    }

    return res.status(401).json({ error: "Invalid credentials" });
});

// 3. Create User Route (Adds to the array)
app.post('/admin/users', (req, res) => {
    const { email, password, role } = req.body;
    console.log(`Creating user: ${email}`);

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ error: "Email and Password are required" });
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: "User already exists" });
    }

    const newUser = {
        id: users.length + 1,
        email,
        password,
        role: role || 'user'
    };

    users.push(newUser);
    
    console.log("Current Users:", users); // Log to see it working
    return res.status(201).json(newUser);
});

app.listen(PORT, () => {
    console.log(`✅ Auth Service running on http://localhost:${PORT}`);
});