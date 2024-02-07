import express from "express";
import { activateUser, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updatePassword, updateProfilePicture, updateUserInfo, updateUserRole,  } from "../controllers/user.controller";
import { authorizeRoles } from "../middleware/auth.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { updateUserRoleService } from "../services/user.service";

const userRouter = express.Router();

userRouter.post('/register', registrationUser); // Changed to '/register'
userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout',authenticate, logoutUser);
// userRouter.get('/refreshToken', updateAccessToken);
userRouter.get('/me',authenticate ,getUserInfo);
userRouter.post('/socialAuth', socialAuth);
userRouter.put('/update-user-info', authenticate,updateUserInfo);
userRouter.put('/update-user-password', authenticate,updatePassword);
userRouter.put('/update-user-avatar',authenticate ,updateProfilePicture);

userRouter.get('/get-User',authenticate , authorizeRoles("admin"),getAllUsers);

userRouter.put('/update-UserStatus',authenticate , authorizeRoles("admin"),updateUserRole);
export default userRouter;
