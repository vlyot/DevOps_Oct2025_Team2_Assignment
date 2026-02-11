import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();

// Initialize Supabase with the ANON key for simplicity
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

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

// SIMPLE CREATE: No JWT check needed to run this
app.post("/admin/users", requireAuth, async (req, res) => {
  const { email, password, role } = req.body;

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

app.listen(3000, () => console.log("🚀 Back to basics on port 3000"));
