import { NextFunction, Request, Response } from "express";
import { promisify } from "util";

export const catchAsyncError =
 (theFunc: any)=> (req:Request,res:Response,next:NextFunction)=>{
    Promise.resolve(theFunc(req,res,next)).catch(next);
}