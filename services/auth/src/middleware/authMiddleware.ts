import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Check if the Authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: "Missing Authorization Header" });
    }

    // 2. Extract the token (Remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Missing Token" });
    }

    // 3. Verify the token with Supabase
    // This also retrieves the user's latest metadata (including role)
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        console.error("Token verification failed:", error?.message);
        return res.status(403).json({ error: "Invalid or Expired Token" });
    }

    // 4. Attach formatted user data to request
    // We explicitly extract the ID and the role from user_metadata
    (req as any).user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user' // Default to 'user' if not set
    };

    next();
};

/**
 * OPTIONAL: Role-Based Access Control (RBAC)
 * Use this to restrict certain routes to 'admin' only
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin rights required." });
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