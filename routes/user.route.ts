import express from "express";
import { activateUser, deleteUser, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updatePassword, updateProfilePicture, updateUserInfo, updateUserRole, refreshAccessToken  } from "../controllers/user.controller";
import { authorizeRoles } from "../middleware/auth.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { updateUserRoleService } from "../services/user.service";

const userRouter = express.Router();

userRouter.post('/registration', registrationUser); // Changed to '/register'
userRouter.post('/activation-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout',authenticate, logoutUser);
userRouter.get('/refresh', authenticate, refreshAccessToken);

// userRouter.get('/refreshToken', updateAccessToken);
userRouter.get('/me',authenticate ,getUserInfo);
userRouter.post('/socialAuth', socialAuth);
userRouter.put('/update-user-info', authenticate,updateUserInfo);
userRouter.put('/update-user-password', authenticate,updatePassword);
userRouter.put('/update-user-avatar',authenticate ,updateProfilePicture);

userRouter.get('/get-User',authenticate , authorizeRoles("admin"),getAllUsers);
//user edit role
userRouter.put('/update-UserStatus',authenticate , authorizeRoles("admin"),updateUserRole);
//delete user
userRouter.delete('/delete-User/:id',authenticate , authorizeRoles("admin"),deleteUser);
export default userRouter;
