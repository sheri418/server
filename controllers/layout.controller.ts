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



/// Edit layout
export const editLayout = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        if (type === "Banner") {
            const bannerData = await LayoutModel.findOne({ type: "Banner" });
            const { image, title, subTitle } = req.body;
            if (bannerData && 'banner' in bannerData && bannerData.banner?.image.public_id) {
                await cloudinary.v2.uploader.destroy(bannerData.banner.image.public_id);
              }
              
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                type: "Banner",
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                title,
                subTitle,
            };
            await LayoutModel.findByIdAndUpdate(bannerData?._id, banner);
        } else if (type === "FAQ") {
            const { faq } = req.body;
            const FaqItem = await LayoutModel.findOne({ type: "FAQ" });
            const faqItems = faq.map((item: any) => ({
                question: item.question,
                answer: item.answer,
            }));
            await LayoutModel.findByIdAndUpdate(FaqItem?._id, { type: "FAQ", faq: faqItems });
        } else if (type === "Categories") {
            const { categories } = req.body;
            const categoriesData = await LayoutModel.findOne({ type: "Categories" });
            const categoriesItems = categories.map((item: any) => ({
                title: item.title,
            }));
            await LayoutModel.findByIdAndUpdate(categoriesData?._id, {
                type: "Categories",
                categories: categoriesItems,
            });
        }

        res.status(200).json({
            success: true,
            message: "Layout updated successfully",
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// get Layout by type
export const getLayoutByType = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body; // Correctly extract the type from req.body
        const layout = await LayoutModel.findOne({ type: type }); // Use an object to specify the query correctly
        if (!layout) {
            return next(new ErrorHandler('Layout not found', 404)); // Handle case where no layout is found
        }
        res.status(200).json({
            success: true,
            layout,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});