import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandling";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { generateLast12MonthsData } from "../utils/analytics.generatar"; // Corrected typo in function name
import userModel from "../models/user.model";

// get users analytics only for admin
export const getUsersAnalytics = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usersAnalytics = await generateLast12MonthsData(userModel); // Corrected variable name to match its purpose
      res.status(200).json({
        success: true,
        data: usersAnalytics, // Changed 'users' to 'data' for clarity
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
