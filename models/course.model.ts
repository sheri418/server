import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";
import { Request, Response, NextFunction } from "express";
// Define interfaces for the document properties
export interface IComment extends Document {
    user: IUser; // Reference to User model
    question: string;
    questionReplies: IComment[];
}

export interface IReview extends Document {
    user: mongoose.Schema.Types.ObjectId;
    rating: number;
    comment: string;
    commentReplies: IComment[];
}

interface ILink extends Document {
    title: string;
    url: string;
}

interface ICourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: { public_id: string, url: string };
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: ILink[];
    suggestion: string;
    questions: IComment[];
}

export interface ICourse extends Document {
    name: string;
    description: string;
    price: number;
    estimatedPrice?: number;
    thumbnail: { public_id: string, url: string };
    tags: string[]; // Array of strings for tags
    level: string;
    demoUrl: string;
    benefits: { title: string }[];
    prerequisites: { title: string }[];
    // reviews: IReview[];
    reviews: mongoose.Types.DocumentArray<IReview>;
    courseData: ICourseData[];
    ratings?: number;
    purchased?: number;
}

// Schema definitions
const commentSchema = new Schema<IComment>({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    question: String,
    questionReplies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
});

const reviewSchema = new Schema<IReview>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // rating: Number,
    rating:{
type:Number,
default:0,
    },
    comment: String,
    commentReplies: [Object],
});

const linkSchema = new Schema<ILink>({
    title: String,
    url: String,
});

const courseDataSchema = new Schema<ICourseData>({
    title: String,
    description: String,
    videoUrl: String,
    videoThumbnail: {
        public_id: String, 
        url: String
    },
    videoSection: String,
    videoLength: Number,
    videoPlayer: String,
    links: [linkSchema],
    suggestion: String,
    questions: [commentSchema],
});

const courseSchema = new Schema<ICourse>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedPrice: Number,
    thumbnail: {
        public_id: { type: String,
          
            },
        url: { type: String, 
            
        }
    },
    tags: [String],
    level: { type: String, required: true },
    demoUrl: { type: String, required: true },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
},{timestamps:true});

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;
