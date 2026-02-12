import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

// Your CHOSEN simple middleware
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Missing Authorization Header" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing Token" });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    console.error("Token verification failed:", error?.message);
    return res.status(403).json({ error: "Invalid or Expired Token" });
  }

  // Attaches the FULL Supabase User object
  (req as any).user = data.user;
  next();
};

// --- UPDATED ADMIN CHECK ---
// Adjusted to read from the raw Supabase object structure
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: "User authentication failed" });
  }

  // 1. Get role from metadata (Supabase stores it here)
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  const role = meta.role || appMeta.role || "user";

  // 2. Check if Admin
  if (role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin rights required." });
  }

  next();
};

/*import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authorize = (requiredRole: 'admin' | 'user') => {
    return (req: Request, res: Response, next: NextFunction) => {

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized ：No Token' });
        }

        const token = authHeader.split(' ')[1];

        try {

            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');


            if (requiredRole === 'admin' && decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Lack of Permission：require admin authorization' });
            }


            (req as any).user = decoded;
            next();
        } catch (err) {

            return res.status(401).json({ message: 'Token expired' });
        }
    };
};*/
