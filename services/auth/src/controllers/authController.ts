import { Request, Response } from "express";
import { supabase } from "../lib/supabase";
import validator from "validator"; // You'll need this import

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // --- 1. VALIDATION LAYER (Moved from index.ts) ---
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Ensure email is a string before validating to avoid crashes
  if (typeof email !== "string" || !validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    // --- 2. Authenticate with Supabase ---
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // --- 3. Get the REAL token and role ---
    const accessToken = data.session?.access_token;
    const role = data.user?.user_metadata?.role || "user";

    // --- 4. Send response ---
    return res.status(200).json({
      token: accessToken,
      role: role,
      message: "Login successful!",
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
