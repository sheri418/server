import { Request, Response, NextFunction } from "express";
import CourseModel from "../models/course.model";
import { catchAsyncError } from "../middleware/catchAsyncErrors";

// Create course
export const createCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body; // Assuming the course data is in the request body
            const course = await CourseModel.create(data);
            
            res.status(201).json({
                success: true,
                course
            });
        } catch (error: any) {
            // Pass the error to the next middleware (error handler)
            next(error);
        }
    }
);
