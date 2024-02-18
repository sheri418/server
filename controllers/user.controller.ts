require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandling";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import Jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path = require('path');
import sendMail from "../utils/sendMail";
// import { accessTokenOptions, refreshTokenOptions } from '../utils/jwt';
import { redis } from "../utils/redis";
import jwt, { JwtPayload } from 'jsonwebtoken';
// import {  verifyToken } from '../utils/jwt';
import { getUserById, getAllUsersService, updateUserRoleService } from '../services/user.service';
import { sendToken } from "../utils/jwt";
import { v2 as cloudinary } from "cloudinary";

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
        from: "sherazgoraya418@gmail.com",
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

export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }

      // Including courses in the query and populating them
      const user = await userModel.findOne({ email }).select("+password").populate('courses');

      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }

      const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar, // Assuming avatar data is correctly structured
        isVerified: user.isVerified,
        isActivated: user.isActivated,
        courses: user.courses, // Include the courses array
        createdAt: user.createdAt ? user.createdAt : null,
        updatedAt: user.updatedAt ? user.updatedAt : null,
      };
      
      // Set user data in Redis
      await redis.set(`user_${user._id}`, JSON.stringify(userData));

      // Set the user ID in a cookie
      res.cookie('userId', user._id.toString(), { httpOnly: true, maxAge: 10 * 60 * 1000 }); // 10 minutes expiration

// Log cookies being set
console.log('Cookies set during login:', res.getHeaders()['set-cookie']);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userData,
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// Logout
// export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // Clear the token cookie
//     res.cookie('token', '', { expires: new Date(Date.now()), httpOnly: true });

//     // Delete the session from Redis
//     const userId = req.user?._id || "";
//     redis.del(userId);

//     // Send a success response
//     res.status(200).json({
//       success: true,
//       message: 'Successfully logged out',
//     });
//   } catch (error) {
//     // Check if error is an instance of Error and get the message
//     let errorMessage = 'An error occurred';
//     if (error instanceof Error) {
//       errorMessage = error.message;
//     }
//     return next(new ErrorHandler(errorMessage, 400));
//   }
// });
// Logout
export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clear the userId cookie
    res.cookie('userId', '', { expires: new Date(Date.now()), httpOnly: true });

    // Delete the user data from Redis
    const userId = req.user?._id || "";
    await redis.del(`user_${userId}`); // Make sure to use the correct key for Redis

    // Log cookies being cleared
    console.log('Cookies cleared during logout:', res.getHeaders()['set-cookie']);

    // Send a success response
    res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error) {
    // Check if error is an instance of Error and get the message
    let errorMessage = 'An error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return next(new ErrorHandler(errorMessage, 400));
  }
});


/// Update access token
// export const updateAccessToken = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   try {
//       const refreshToken = req.cookies.refresh_token as string;
//       if (!refreshToken) {
//           throw new ErrorHandler('Refresh token is missing', 400);
//       }

//       const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload;
//       if (!decoded) {
//           throw new ErrorHandler('Could not refresh token', 400);
//       }

//       const session = await redis.get(decoded.id as string);
//       if (!session) {
//           throw new ErrorHandler('Session not found', 400);
//       }

//       const user = JSON.parse(session);
//       const newAccessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET as string, {
//           expiresIn: "5m",
//       });
//       const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET as string, {
//           expiresIn: "3d",
//       });

//       // Update cookies
//       res.cookie("access_token", newAccessToken, accessTokenOptions);
//       res.cookie("refresh_token", newRefreshToken, refreshTokenOptions);

//       res.status(200).json({
//           status: "success",
//           accessToken: newAccessToken
//       });
//   } catch (error: any) {
//       return next(new ErrorHandler(error.message, 400));
//   }
// });
// Assuming that you are using JWT for tokens and you have a function to generate tokens
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Runtime check to ensure environment variables are not undefined
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

    if (!refreshTokenSecret || !accessTokenSecret) {
      console.error("Environment variables for token secrets are not set.");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify the refresh token
    const userData = jwt.verify(refreshToken, refreshTokenSecret);
    
    // Assuming userData has an id field; otherwise, adjust as necessary
    const newAccessToken = jwt.sign({ id: (userData as any).id }, accessTokenSecret, { expiresIn: '1h' });

    res.cookie('access_token', newAccessToken, { httpOnly: true, sameSite: 'strict' });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};


//get user info
export const getUserInfo = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      // User is recognized (either by token or persisted ID)
      const userId = req.user._id;
      await getUserById(userId, res);
    } else {
      // User is not recognized, return a general response
      res.status(200).json({ message: "User is not authenticated or recognized" });
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});


//social auth
interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}
export const socialAuth = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;

      let user = await userModel.findOne({ email }).populate('courses');

      if (!user) {
        // Create a new user if it does not exist
        user = await userModel.create({
          email,
          name,
          avatar: { public_id: 'default_id', url: avatar }
        });
        // If you need to populate courses right after creating the user, you can do it here
      }

      // Respond with user details, without sending a token
      res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified,
          // isActivated: user.isActivated,
          courses: user.courses // Array of courses
        }
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);



//update user data

interface IUpdateUserInfo {
  name?: string;
  email?: string;
}
export const updateUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name} = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // if (email) {
      //   const isEmailExist = await userModel.findOne({ email, _id: { $ne: userId } });
      //   if (isEmailExist) {
      //     return next(new ErrorHandler("Email already exists", 400));
      //   }
      //   user.email = email;
      // }

      if (name) {
        user.name = name;
      }

      await user.save();

      try {
        await redis.set(userId.toString(), JSON.stringify(user));
      } catch (redisError) {
        console.error("Redis error: ", redisError);
        // Handle Redis error appropriately
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


//update user password
// update user password
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const updatePassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body as IUpdatePassword;

    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler("Please enter old and new password", 400));
    }

    const user = await userModel.findById(req.user?._id).select("+password");

    if (!user || user.password === undefined) {
      return next(new ErrorHandler("Invalid user", 400));
    }

    const isPasswordMatch = await user.comparePassword(oldPassword);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid old password", 400));
    }

    user.password = newPassword;
    await user.save();
    await redis.set(req.user?._id, JSON.stringify(user));

    // Omit the password from the response data
    const responseUser = { ...user.toObject(), password: undefined };

    res.status(200).json({
      success: true,
      user: responseUser,
    });
  } catch (error: any) {
    let errorMessage = 'An error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return next(new ErrorHandler(errorMessage, 400));
  }
});

//avatar 
interface IUpdateProfilePicture {
  avatar: string;
}

export const updateProfilePicture = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateProfilePicture;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (avatar && user) {
        // Delete the old image if it exists
        if (user.avatar && user.avatar.public_id) {
          await cloudinary.uploader.destroy(user.avatar.public_id);
        }
        
        // Upload the new image
        const myCloud = await cloudinary.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });
        
        // Update user's avatar data
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      
        await user.save();
        await redis.set(userId, JSON.stringify(user));

        res.status(200).json({
          success: true,
          user,
        });
      } else {
        next(new ErrorHandler("Avatar or user not found", 400));
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return next(new ErrorHandler(errorMessage, 400));
    }
  }
);

// get all users - only for admin
export const getAllUsers = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Call the service and await its result
    getAllUsersService(res);
  } catch (error: any) {
    // Error handling remains the same
    return next(new ErrorHandler(error.message, error.statusCode || 500));
  }
});

// Assuming updateUserRoleService is an async function that updates the user's role
// and CatchAsyncError is a higher-order function for error handling

export const updateUserRole = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { id, role } = req.body; // Corrected destructuring syntax
  await updateUserRoleService(res,id, role); // Assuming this function exists and returns a promise
  res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
  });
});

//delete user -- only admin
// Delete user function, wrapped in CatchAsyncError for asynchronous error handling
// deleteUser is an asynchronous function, now including a try-catch block for error handling
export const deleteUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
      // Extract the user ID from the request parameters
      const { id } = req.params;

      // Attempt to find the user by ID in the database
      const user = await userModel.findById(id);

      // If no user is found, throw a custom error to be caught by the catch block
      if (!user) {
          throw new ErrorHandler("User not found", 404);
      }

      // Delete the user document
      await user.deleteOne();

      // Additionally, delete any associated cache from Redis using the user ID
      await redis.del(id);

      // Respond with a success message indicating the user has been deleted
      res.status(200).json({
          success: true,
          message: "User deleted successfully",
      });
  } catch (error:any) {
      // If an error occurs, pass it to the next error handler
      return next (new ErrorHandler(error.message,400));
      
  }
});













export default { registrationUser, activateUser, loginUser, logoutUser, updateUserInfo };