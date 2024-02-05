import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel from "../models/order.model"; // Make sure the path and file name match exactly

// Correct the function signature to include req, res, and next in the correct order
export const newOrder = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  // Assuming 'data' comes from 'req.body'; adjust as needed for your use case
  const data = req.body;
  try {
    const order = await OrderModel.create(data);
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    // Use 'next' to pass errors to Express's error handling middleware
    next(error);
  }
});
