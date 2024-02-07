import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandling";
import OrderModel from "../models/order.model";
import UserModel from "../models/user.model";
import CourseModel from "../models/course.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { getAllOrderService } from "../services/order.service";

export const createOrder = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body;
        const user = await UserModel.findById(req.user?._id).select('+courses'); // Ensure courses are included if select: false is set in your schema
        
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Initialize user.courses as an empty array if undefined
        user.courses = user.courses || [];

        const courseExistInUser = user.courses.some(course => course.toString() === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }


        const newOrder = await OrderModel.create({
            courseId: course._id,
            userId: user._id,
            payment_info
        });

        const mailData = {
            order: {
                _id: newOrder._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            }
        };

        const html = await ejs.renderFile(path.join(__dirname, '../mails/order-confirmation.ejs'), mailData);

        try {
            await sendMail({
                to: user.email,
                subject: "Order Confirmation",
                html: html,
                template: "", // Assuming your sendMail can handle this being empty if html is provided
                data: {} // Providing an empty object or appropriate default value
            });
        } catch (error) {
            console.error("Email sending failed:", error);
        }

        user.courses.push(course._id);
        await user.save();

        try {
            await NotificationModel.create({
                userId: user._id,
                title: "New Order",
                message: `You have a new order from ${course.name}`,
            });
        } catch (error) {
            console.error("Failed to create notification:", error);
            // Consider whether to continue throwing this error or handle it differently
        }

      
        course.purchased? course.purchased +=1 :course.purchased;
        await course.save();

        res.status(201).json({
            success: true,
            message: "Order created successfully.",
            order: newOrder
        });
    } catch (error:any) {
        console.error("Order creation failed:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

//get all order only for admin
export const getAllOrders = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Call the service and await its result
      getAllOrderService(res);
    } catch (error: any) {
      // Error handling remains the same
      return next(new ErrorHandler(error.message, error.statusCode || 500));
    }
  });