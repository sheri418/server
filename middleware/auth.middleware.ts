
import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/ErrorHandling'; // Assuming ErrorHandler is defined
// import { verifyToken } from '../utils/jwt'; // Assuming this is your JWT verification utility
import { IUser } from '../models/user.model'; // Assuming IUser is your User type
import jwt, { JwtPayload } from 'jsonwebtoken';
import { catchAsyncError } from './catchAsyncErrors';
import { redis } from '../utils/redis';
import UserModel from '../models/user.model';
// Extend the Express Request type to include the user property



interface RequestWithUser extends Request {
  user?: IUser; // Adding the user property to the Request type
}

export const authenticate = catchAsyncError(async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.access_token as string;
 // Log cookies received from the client
 console.log('Cookies received from client:', req.cookies);

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN as string) as JwtPayload;
      const user = await redis.get(`user_${decoded.id}`);
      if (!user) {
        return next(new ErrorHandler('User not found in cache', 401));
      }
    } catch (error) {
      console.error("Error verifying token:", error);
    }
  }

  // Attempt to recognize the user by another means (e.g., a user ID)
  const userId = req.cookies.userId; // Example: using a cookie to store user ID
  if (userId) {
    const user = await UserModel.findById(userId); // Fetch user from DB
    if (user) {
      req.user = user;
      return next();
    }
  }

  // If no token and no user ID, proceed without authenticated user
  next();
});


// Middleware to authorize user roles
// validate user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || '')) {
      // Corrected the string template syntax here
      return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
    }
    next();
  };
};
