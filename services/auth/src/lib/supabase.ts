import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Logic check: If SERVICE_ROLE is missing, this will fail
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseKey) {
  console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
