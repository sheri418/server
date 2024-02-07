import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandling";
import { catchAsyncError } from '../middleware/catchAsyncErrors';
import LayoutModel from "../models/layout.model";
import cloudinary from 'cloudinary';
// create layout
export const createLayout = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        if (type === "Banner") {
            const { image, title, subTitle } = req.body; // Corrected destructuring assignment
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                type, // Assuming you need to store the type as well
                banner: {
                    image: {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    },
                    title,
                    subTitle,
                },
            };
            await LayoutModel.create(banner);
        } else if (type === "FAQ") {
            const { faq } = req.body; // Corrected destructuring syntax
            await LayoutModel.create({ type, faq });
        } else if (type === "Categories") {
            const { categories } = req.body;
            await  LayoutModel.create({ type, categories });
        }

        res.status(200).json({
            success: true,
            message: "Layout created successfully",
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});