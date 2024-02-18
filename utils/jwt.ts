// // Import required modules
// import jwt from 'jsonwebtoken';
// import { Response } from 'express';
// import { IUser } from '../models/user.model'; // Assuming this is your User type
// import { redis } from './redis'; // Assuming this is your Redis configuration

// // Check and set environment variables

// // const JWT_SECRET = 'your-secret-key'; // Replace with your actual secret key
// // const JWT_EXPIRATION = '1h'; // Adjust the expiration time as needed

// // export const signToken = (data: object) => {
// //   return jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
// // };

// // export const verifyToken = (token: string) => {
// //   try {
// //     return jwt.verify(token, JWT_SECRET);
// //   } catch (error) {
// //     throw new Error('Invalid token');
// //   }
// // };

// // Token options interface
// interface ITokenOptions {
//   expires: Date;
//   maxAge: number;
//   httpOnly: boolean;
//   sameSite: 'lax' | 'strict' | 'none' | undefined;
//   secure?: boolean;
// }

// export const sendToken = (user: IUser, statusCode: number, res: Response) => {
//   const accessToken = user.signAccessToken();
//   const refreshToken = user.signRefreshToken();

//   // Upload session to redis
//   // redis.set(user._id, JSON.stringify(user));
//   // Store user session in Redis
//   redis.set(user._id.toString(), JSON.stringify(user));

//   const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "3600", 10);
//   const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "604800", 10);

//   // Options for cookies
//   const accessTokenOptions: ITokenOptions = {
//     expires: new Date(Date.now() + accessTokenExpire * 1000),
//     maxAge: accessTokenExpire * 1000,
//     httpOnly: true,
//     sameSite: 'lax',
//   };

//   const refreshTokenOptions: ITokenOptions = {
//     expires: new Date(Date.now() + refreshTokenExpire * 1000),
//     maxAge: refreshTokenExpire * 1000,
//     httpOnly: true,
//     sameSite: 'lax',
//   };

//   if (process.env.NODE_ENV === 'production') {
//     accessTokenOptions.secure = true;
//     refreshTokenOptions.secure = true;
//   }

//   // Setting cookies
//   res.cookie('access_token', accessToken, accessTokenOptions);
//   res.cookie('refresh_token', refreshToken, refreshTokenOptions);

//   // Sending response
//   res.status(statusCode).json({
//     success: true,
//     user, 
//     accessToken,
//     refreshToken
//   });
// };


//     //    // Parse environment variables for token expiry
//     //    const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10); // Default 5 minutes
//     //    const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '10080', 10); // Default 7 days
   
//     //    // Options for access token cookie
//     //   export const accessTokenOptions: ITokenOptions = {
//     //        expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
//     //        maxAge: accessTokenExpire * 60 * 60 * 1000,
//     //        httpOnly: true,
//     //        sameSite: 'lax',
//     //        secure: process.env.NODE_ENV === 'production'
//     //    };
   
//     //    // Options for refresh token cookie
//     //  export  const refreshTokenOptions: ITokenOptions = {
//     //        expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
//     //        maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
//     //        httpOnly: true,
//     //        sameSite: 'lax',
//     //        secure: process.env.NODE_ENV === 'production'
//     //    };

// // // Function to generate access token
// // export const signAccessToken = (userId: string) => {
// //     return jwt.sign({ id: userId }, JWT_SECRET, {
// //         expiresIn: `${accessTokenExpire}s` // expiresIn value in seconds
// //     });
// // }

// // // Function to generate refresh token
// // export const signRefreshToken = (userId: string) => {
// //     return jwt.sign({ id: userId }, JWT_SECRET, {
// //         expiresIn: `${refreshTokenExpire}m` // expiresIn value in minutes
// //     });
// // }

// // Function to send tokens to the client
// // export const sendToken = (user: IUser, statusCode: number, res: Response) => {
// //     const accessToken = user.signAccessToken();
// //     const refreshToken = user.signRefreshToken();

//     // Upload session to Redis
//     // redis.set(user._id.toString(), JSON.stringify(user));

 

//     // Setting cookies
//     // res.cookie('access_token', accessToken, accessTokenOptions);
//     // res.cookie('refresh_token', refreshToken, refreshTokenOptions);

import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { IUser } from '../models/user.model';
import { redis } from './redis';

const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'default_access_secret';
const JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret';
const JWT_ACCESS_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRE || '3600'; // Default 1 hour
const JWT_REFRESH_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRE || '604800'; // Default 7 days

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: 'lax' | 'strict' | 'none' | undefined;
  secure?: boolean;
}

const signAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_ACCESS_SECRET, {
    expiresIn: parseInt(JWT_ACCESS_EXPIRATION, 10) // Parse to integer
  });
};

const signRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: parseInt(JWT_REFRESH_EXPIRATION, 10) // Parse to integer
  });
};

export const sendToken = async (user: IUser, statusCode: number, res: Response) => {
  try {
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());

    // Store user session in Redis
    await redis.set(`user_${user._id}`, JSON.stringify(user));

    const accessTokenOptions: ITokenOptions = {
      expires: new Date(Date.now() + parseInt(JWT_ACCESS_EXPIRATION, 10) * 1000), // Parse to integer
      maxAge: parseInt(JWT_ACCESS_EXPIRATION, 10) * 1000, // Parse to integer
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };

    const refreshTokenOptions: ITokenOptions = {
      expires: new Date(Date.now() + parseInt(JWT_REFRESH_EXPIRATION, 10) * 1000), // Parse to integer
      maxAge: parseInt(JWT_REFRESH_EXPIRATION, 10) * 1000, // Parse to integer
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };

    // Set cookies
    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);

    // Send response
    res.status(statusCode).json({
      success: true,
      message: "Tokens are set in cookies",
      accessToken,
      refreshToken
    });
  } catch (error) {
    // Handle errors
    console.error('Error setting tokens:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};