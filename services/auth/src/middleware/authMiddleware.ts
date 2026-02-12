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
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        console.error("Token verification failed:", error?.message);
        return res.status(403).json({ error: "Invalid or Expired Token" });
    }

    // 4. Token is good! Attach user to request and proceed
    (req as any).user = data.user;
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