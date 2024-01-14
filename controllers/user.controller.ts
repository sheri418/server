require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandling";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import Jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
// import path from "path";
const path = require('path');
import { send } from "process";
import sendMail from "../utils/sendMail";

// register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}
export const registrationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const isEmailExist = await userModel.findOne({ email });
      //agr email paly sa ho

      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      const user: IRegistrationBody = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };

      const filePath = path.join(__dirname, '..//mails//index.html');


      console.log(`The file path is: ${filePath}`); // This will output the file path to the console
      
      const html = await ejs.renderFile(filePath, data);
      

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          // template: " activation-mail.ejs",
          template: " index.html",
          data,
        });
        res.status(201).json({
          success: true,
          message: "Account activation required.",
          details: `Please check your email (${
            user.email ? user.email : "not available"
          }) to activate your account.`,
          data: {
            email: user.email || "Email not provided",
            activationToken: activationToken.token || "Token not generated",
          },
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = Jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret, //
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// activate user
export const activateUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body; // Directly destructuring from req.body

    const existUser = await userModel.findOne({ email });

    if (existUser) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    const user = await userModel.create({
      name,
      email,
      password,
    });

    res.status(201).json({ // Sending a response with status 201
      success: true,
      message: 'User successfully created',
      user,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// Login user

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { email, password } = req.body as ILoginRequest;

      // Validate email and password presence
      if (!email || !password) {
          return next(new ErrorHandler("Please enter email and password", 400));
      }

      // Attempt to find the user and include the password in the result
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
          return next(new ErrorHandler("Invalid email or password", 401)); // 401 for Unauthorized
      }

      // Compare the provided password with the stored hash
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
          return next(new ErrorHandler("Invalid email or password", 401));
      }

      // Handle successful login
      // For example, generating a token, setting a response cookie, etc.
      // ...

      // Send successful response
      res.status(200).json({
          success: true,
          message: 'Login successful',
          // Include other relevant data (e.g., user data, token) if needed
      });

  } catch (error: any) {
      // Error handling
      return next(new ErrorHandler(error.message, 500)); // 500 for Internal Server Error
  }
});


//logout

export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Set the token or cookie to an empty value and make it expire immediately
        res.cookie('token', '', { expires: new Date(Date.now()), httpOnly: true });

        res.status(200).json({
            success: true,
            message: 'Successfully logged out'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
