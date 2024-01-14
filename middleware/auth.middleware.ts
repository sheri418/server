import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import ErrorHandler from '../utils/ErrorHandling'; // Assuming this is your error handler
import { IUser } from '../models/user.model';


interface RequestWithUser extends Request {
    user?: IUser; // Assuming IUser is your user type from the user model
}

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

// Validate user role
export const authorizeRoles = (...roles: string[]) => {
    return (req: RequestWithUser, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access these resources`, 403));
        }
        next();
    }
};