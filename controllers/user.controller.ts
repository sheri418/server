require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandling";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import Jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path = require('path');
import sendMail from "../utils/sendMail";
import { generateToken } from '../utils/jwt';
import { redis } from "../utils/redis";

// Define the structure of the registration body
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

// Define the structure for the activation token
interface IActivationToken {
  token: string;
  activationCode: string;
}

// Function to handle user registration
export const registrationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as IRegistrationBody;
      const isEmailExist = await userModel.findOne({ email });

      if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const newUser: IRegistrationBody = { name, email, password };
      const activationToken = createActivationToken(newUser);
      const data = { user: { name: newUser.name }, activationCode: activationToken.activationCode };
      const filePath = path.join(__dirname, '../mails/index.html');

      const html = await ejs.renderFile(filePath, data);

      await sendMail({
        from: "your-email@example.com",
        to: newUser.email,
        subject: "Activate your account",
        html, // Rendered HTML from EJS template
        template: "index.html",
        data,
      });
      // Saving user to database (ensure password is hashed)
      const user = new userModel({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password, // Hash this password
        isActivated: false
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: "Account activation required. Please check your email.",
        data: {
          email: newUser.email,
          activationToken: activationToken.token
        }
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Create an activation token
export const createActivationToken = (user: IRegistrationBody): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = Jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// Function to activate user account
export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activationToken } = req.body;
      const decoded = Jwt.verify(activationToken, process.env.ACTIVATION_SECRET as Secret) as any;
      const user = await userModel.findOne({ email: decoded.user.email });
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (user.isActivated) {
        return next(new ErrorHandler("User already activated", 400));
      }

      user.isActivated = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'User successfully activated',
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error: any) {
      return next(new ErrorHandler("Invalid or expired activation token", 400));
    }


  }
);

// ... (loginUser, logoutUser, etc.) ...




// Login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as ILoginRequest;

    if (!email || !password) {
      return next(new ErrorHandler("Please enter email and password", 400));
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    const token = generateToken(user as IUser);

       // Set cookie with the token
       res.cookie('token', token, {
        httpOnly: true, // The cookie is not accessible via JavaScript
        secure: process.env.NODE_ENV === 'production', // Use 'Secure' in production
        expires: new Date(Date.now() + 3600000), // Cookie expires in 1 hour
        sameSite: 'lax' // CSRF protection
    });
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
    });

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Logout
export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie('token', '', { expires: new Date(Date.now()), httpOnly: true });
const userId= req.user?._id || "";
redis.del(userId);
    res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export

  default { registrationUser, activateUser, loginUser, logoutUser };