require('dotenv').config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import {ErrorMiddleware} from "./middleware/error";
import userModel from "./routes/user.route";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRoute from "./routes/notification.route";
import analyticsRouter from './routes/analytics.route';
import layoutRouter from "./routes/layout.route";


//body parser
app.use(express.json({limit:"50mb"}));

//cookie parser
app.use(cookieParser());

//cors=> cross origin recourse sharing 
app.use(cors({
    origin:['http://localhost:3000'],
    credentials:true,
}));

//route api
app.use('/api/v1', userRouter, courseRouter, orderRouter, notificationRoute, analyticsRouter,layoutRouter);




//TESTING API
app.get("/test", (req:Request, res:Response, next:NextFunction) => {
    res.status(200).json({
        success:true,
        message:"API is working",
    });
});

//unknown route
// ...
// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    console.log(`Requested URL: ${req.originalUrl}`); // Debugging: Log the requested URL
    next(err);
});
// ...


app.use(ErrorMiddleware);
app.use(express.json());