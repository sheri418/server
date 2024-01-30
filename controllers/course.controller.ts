import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandling";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";

// Upload course
export const uploadCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const { thumbnail } = data;

        // Check if thumbnail URL is provided and is a string
        if (thumbnail && typeof thumbnail.url === 'string') {
            // Upload thumbnail to Cloudinary
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail.url, {
                folder: "courses"
            });

            // Update thumbnail data with the result from Cloudinary
            data.thumbnail = {
                public_id: myCloud.public_id, 
                url: myCloud.secure_url
            };
        } else {
            // Handle cases where thumbnail is not provided or invalid
            console.log("Thumbnail is not provided or is not a valid string");
        }

        // Call createCourse service to save 'data' to your database
        await createCourse(data, res, next);

        // Note: Ensure that createCourse handles sending the response
    } catch (error: any) {
        // Error handling
        return next(new ErrorHandler(error.message, 500));
    }
});
