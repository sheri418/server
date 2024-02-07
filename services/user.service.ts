// user.service.ts
import { Response } from 'express';
import UserModel, { IUser } from '../models/user.model';
import { redis } from '../utils/redis';
// import { verifyToken } from '../utils/jwt'; // Import from your JWT utility file


export const getUserById = async (id: string, res: Response) => {
  try {
    const userJson = await redis.get(id);

    if (userJson) {
      // User found in Redis
      const user = JSON.parse(userJson);
      res.status(200).json({
        success: true,
        user,
      });
    } else {
      // User not found in Redis, fetch from MongoDB
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
      } else {
        // Save the user data to Redis
        await redis.set(id, JSON.stringify(user));
        res.status(200).json({
          success: true,
          user,
        });
      }
    }
  } catch (error) {
    let errorMessage = 'An error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
};

// Get All users
export const getAllUsersService = async (res: Response) => {
  const users = await UserModel.find().sort({ createdAt: -1 });
  res.status(201).json({
  success: true,
  users,
  });
  };