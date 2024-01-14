import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandling";

export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
   err.statusCode = err.statusCode || 500;
   err.message = err.message || 'Internal server error'; 

   // Wrong MongoDB ID error
   if (err.name === 'CastError') {
      const message = `Resource not found. Invalid: ${err.path}`;
      err = new ErrorHandler(message, 400);
   }

   // Duplicate key error
   if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
      err = new ErrorHandler(message, 400); 
   }

   // JWT expired error
   if (err.name === 'TokenExpiredError') {
      const message = 'JSON Web Token is expired. Please log in again.';
      err = new ErrorHandler(message, 400);
   }

   // Additional error handling can be added here

   // Development error logging
   if (process.env.NODE_ENV === 'development') {
      console.error(err);
   }

   res.status(err.statusCode).json({
      success: false,
      message: err.message,
   });
};
