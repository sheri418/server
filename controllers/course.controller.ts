import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandling";
import cloudinary from "cloudinary";
import CourseModel from "../models/course.model"; // Update with the correct path
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { redis } from "../utils/redis";
import UserModel from "../models/user.model";

// Assuming catchAsyncError is a middleware for handling async errors
export const uploadCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Received data:', req.body); // Log incoming data for debugging

        const data = req.body;

        // Handle thumbnail upload if provided
        if (data.thumbnail && typeof data.thumbnail.url === 'string') {
            const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail.url, {
                folder: "courses"
            });

            data.thumbnail = {
                public_id: myCloud.public_id, 
                url: myCloud.secure_url
            };
        } else {
            console.log("Thumbnail is not provided or is not a valid string");
        }

        // Create a new course
        const course = new CourseModel(data);
        await course.save();

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });
    } catch (error: any) {
        console.error('Error in uploadCourse:', error.message); // Log the error for debugging
        return next(new ErrorHandler(error.message, 500));
    }
});


// edit course
export const editCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const courseId = req.params.id;
        const data = req.body;
        const course = await CourseModel.findById(courseId);
  
        if (!course) {
          return next(new ErrorHandler('Course not found', 404));
        }
  
        // Check if new thumbnail is provided
        if (data.thumbnail && typeof data.thumbnail === 'string') {
          // Destroy old thumbnail in Cloudinary if it exists
          if (course.thumbnail && course.thumbnail.public_id) {
            await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
          }
  
          // Upload new thumbnail to Cloudinary
          const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
            folder: 'courses',
          });
  
          // Update thumbnail data with the result from Cloudinary
          data.thumbnail = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
  
        // Update the course with new data
        const updatedCourse = await CourseModel.findByIdAndUpdate(courseId, {
          $set: data,
        }, { new: true });
  
        res.status(200).json({
          success: true,
          course: updatedCourse,
        });
  
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );



  // get single course without purchasing
  export const getSingleCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);
      console.log("hitting redis")
  
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        console.log("hitting mongodb")
        if (!course) {
          return next(new ErrorHandler('Course not found', 404));
        }
  
        await redis.set(courseId, JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  });

  // get all courses without purchasing
  export const getAllCourses = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const isCacheExist = await redis.get("allCourses");
  
        if (isCacheExist) {
          const courses = JSON.parse(isCacheExist);
          res.status(200).json({
            success: true,
            courses,
          });
        } else {
          const courses = await CourseModel.find().select(
            "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
          );
  
          await redis.set("allCourses", JSON.stringify(courses));
          res.status(200).json({
            success: true,
            courses,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


 
// get course content for a valid user
export const getCourseByUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const courseId = req.params.id;
console.log(courseId);
      // Check if the user is enrolled in the course
      const isEnrolled = await UserModel.exists({ _id: userId, courses: courseId });
      if (!isEnrolled) {
        return next(new ErrorHandler("You are not eligible to access this course", 403));
      }

      // Fetch the course details since the user is enrolled
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error); // Log the error for debugging
        return next(new ErrorHandler(error.message, 500));
      } else {
        console.error("Unknown error:", error); // Log the unknown error
        return next(new ErrorHandler('An unknown error occurred', 500));
      }
    }
  }
);

