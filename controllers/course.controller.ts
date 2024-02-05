import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandling";
import cloudinary from "cloudinary";
import CourseModel from "../models/course.model"; // Update with the correct path
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { redis } from "../utils/redis";
import UserModel from "../models/user.model";
import mongoose from "mongoose";
import ejs from 'ejs';
import path from "path";
// In your course controller file
import sendMail from '../utils/sendMail';
 // Replace with the correct relative path to the sendMail file

import nodemailer from 'nodemailer';
import { title } from "process";
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


// get question in the course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, courseId, contentId }: IAddQuestionData = req.body;
    const course = await CourseModel.findById(courseId);

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler("Invalid content id", 400));
    }

    const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));

    if (!courseContent) {
      return next(new ErrorHandler("Invalid content id", 400));
    }

    // create a new question object
    const newQuestion: any = {
      user: req.user,
      question,
      questionReplies: [],
    };

    // add this question to our course content
    courseContent.questions.push(newQuestion);

    // save the updated course
    await course?.save();

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// add answer in course question
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;
    const course = await CourseModel.findById(courseId);

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler("Invalid content id", 400));
    }

    const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));

    if (!courseContent) {
      return next(new ErrorHandler("Invalid content id", 400));
    }

    const question = courseContent?.questions?.find((item: any) => item._id.equals(questionId));

    if (!question) {
      return next(new ErrorHandler("Invalid question id", 400));
    }

    // create a new answer object
    const newAnswer: any = {
      user: req.user,
      answer, // Assuming answer is a string provided in the request body
    };

    // Add this answer to our course content question
    question.questionReplies.push(newAnswer);

    // Save the updated course
    await course?.save();

    if (req.user?._id !== question.user._id) {
      // Create a notification (you need to implement this part)
      // You can use a notification system or send a response to the user based on your application's logic.
      // For example:
      const notification = {
        userId: question.user._id,
        message: 'You have a new answer to your question.',
      };
      // Save the notification to your database or notify the user through your preferred method.

      // Send an email notification to the question's user
      const data = {
        name: question.user.name,
        title: courseContent.title,
      };

      // Assuming you have the email sending logic implemented, here's how to render and send an email using EJS:
      try {
        const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data);

        await sendMail({
          from: "sherazgoraya418@gmail.com",
          to: question.user.email,
          subject: "Question Reply",
          template: "question-reply.ejs",
          data,
          
        });

      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }

    res.status(200).json({
      success: true,
      course,
    });

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

//add review 

interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userCourseList = req.user?.courses;
    const courseId = req.params.id;

    // Check if the user is enrolled in the course
    // const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId.toString());
    // if (!courseExists) {
    //   return next(new ErrorHandler("You are not eligible to review this course", 403));
    // }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const { review, rating } = req.body as IAddReviewData;

    const reviewData = {
      user: req.user?._id,
      rating, // Use the destructured variable
      comment: review, // Use the destructured variable for the comment
    };


    course.reviews.push(reviewData as any);


    // Calculate the average rating
    let avg = course.reviews
    .map(review => review.rating)
    .filter(rating => !isNaN(rating))
    .reduce((acc, rating) => acc + rating, 0);
    const averageRating = course.reviews.length > 0 ? avg / course.reviews.length : 0;
course.ratings = averageRating;

    // Create and handle notification
    const notification = {
      title: "New Review Received",
      message: `${req.user?.name} has given a review in ${course.name}`,
    };
    console.log(notification); // Replace with your actual notification handling logic

    await course.save(); // Save the updated course document

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});


//add reply review
interface IAddReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReplyData;

      const course = await CourseModel.findById(courseId) ;
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const review = course?.reviews?.find((rev:any)=>rev._id.toString()===reviewId); // Should work with updated typing
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const replyData:any = {
        user: req.user, // Assuming req.user is populated with user data
        comment,
      };
if(!review.commentReplies){
  review.commentReplies=[];
}
      review.commentReplies?.push(replyData); // Adding the reply to the replies array of the review

      await course?.save();

      res.status(200).json({
        success: true,
        message: "Reply added to the review successfully",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);