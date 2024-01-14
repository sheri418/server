import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import ErrorHandler from '../utils/ErrorHandling'; // Assuming this is your error handler
import { IUser } from '../models/user.model';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers['authorization'];

    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
    }

    if (!token) {
        return next(new ErrorHandler('No token provided', 401));
    }

    try {
        const decoded = verifyToken(token) as IUser; // Cast to IUser
        req.user = decoded;
        next();
    } catch (error) {
        return next(new ErrorHandler('Invalid token', 403));
    }
};
