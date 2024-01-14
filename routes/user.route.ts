import express from "express";
import { activateUser, loginUser, logoutUser, registrationUser } from "../controllers/user.controller";
import { authorizeRoles } from "../middleware/auth.middleware";
import { authenticate } from "../middleware/auth.middleware";

const userRouter = express.Router();

userRouter.post('/register', registrationUser); // Changed to '/register'
userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.post('/logout',authenticate,authorizeRoles("admin"), logoutUser);

export default userRouter;
