import express from "express";
import { uploadCourse } from "../controllers/course.controller"; 
import { authorizeRoles, authenticate } from "../middleware/auth.middleware";

const courseRouter = express.Router();
courseRouter.post("/create-course", authenticate, authorizeRoles("admin"), uploadCourse);
export default courseRouter;