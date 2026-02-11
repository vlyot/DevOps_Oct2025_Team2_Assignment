import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { requireAuth } from "./middleware/authMiddleware";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import validator from "validator";

dotenv.config();

// Initialize Supabase with the ANON key for simplicity
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

const app = express();
// 1. HELMET: Sets various HTTP headers to block common web attacks
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allows CSS from your own app
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"], // Allows images from HTTPS sources
      },
    },
    hsts: {
      maxAge: 31536000, // Enforce HTTPS for 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// 2. RATE LIMITER: Stops hackers from brute-forcing passwords
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window (increased for testing)
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(loginLimiter);
app.use(cors());
app.use(express.json());

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // VALIDATION LAYER
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // 1. Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: error.message });

  // 2. Get the REAL token and role
  const accessToken = data.session?.access_token; // <--- The Real JWT
  const role = data.user?.user_metadata?.role || "user";

  // 3. Send it to the Frontend
  return res.status(200).json({
    token: accessToken,
    role: role,
    message: "Login successful!",
  });
});

app.post("/admin/users", requireAuth, async (req, res) => {
  const { email, password, role } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  // We use the basic signup method which is easier to test
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: role || "user" },
    },
  });

  if (error) return res.status(400).json({ error: error.message });

  return res.status(201).json({
    id: data.user?.id,
    email: email,
    role: role,
  });
});

app.get("/admin/users", requireAuth, async (req, res) => {
  console.log("Attempting to list users...");

  // DEBUG: Check if the key is actually loaded
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("❌ CRITICAL: SERVICE_ROLE_KEY is missing!");
    return res
      .status(500)
      .json({ error: "Server misconfiguration: No Service Key" });
  }

  // 2. CREATE A SPECIAL ADMIN CLIENT JUST FOR THIS ACTION
  // We do this here to be 100% sure we are using the Secret Key, not the Anon Key
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 3. Use this new 'supabaseAdmin' client to fetch the list
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error("Supabase Error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  // 4. Send the data back
  const users = data.users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || "user",
    created_at: user.created_at,
  }));

  console.log(`✅ Successfully fetched ${users.length} users.`);
  return res.status(200).json(users);
});

// DELETE route - Remove a user
app.delete("/admin/users/email/:email", requireAuth, async (req, res) => {
  const { email } = req.params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    serviceKey as string,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Find the user by email first to get their UUID
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) throw listError;

    const userToDelete = listData.users.find((u) => u.email === email);

    if (!userToDelete) {
      return res.status(404).json({ error: "User with this email not found" });
    }

    // 2. Delete the user using the UUID we just found
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userToDelete.id
    );

    if (deleteError) throw deleteError;

    return res.status(200).json({
      message: `User ${email} deleted successfully`,
      id: userToDelete.id,
    });
  } catch (err: any) {
    console.error("Delete Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE route - Change a user's role
app.put("/admin/users/email/:email/role", requireAuth, async (req, res) => {
  const { email } = req.params;
  const { role } = req.body; // e.g., { "role": "admin" }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL as string,
    serviceKey as string,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Find the user by email to get their ID
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const userToUpdate = listData.users.find((u) => u.email === email);

    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Update the metadata using the ID we found
    const { data: updatedData, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userToUpdate.id, {
        user_metadata: { role: role },
      });

    if (updateError) throw updateError;

    return res.status(200).json({
      message: `Role for ${email} updated to ${role}`,
      user: {
        id: updatedData.user.id,
        email: updatedData.user.email,
        role: updatedData.user.user_metadata.role,
      },
    });
  } catch (err: any) {
    console.error("Update Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Health check endpoint for DAST scanning
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "auth" });
});

app.listen(3000, () => console.log("🚀 Back to basics on port 3000"));
