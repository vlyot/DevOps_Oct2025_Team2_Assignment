import { Request, Response, NextFunction } from 'express';
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
};