import express from "express";
import { editCourse, uploadCourse } from "../controllers/course.controller"; 
import { authorizeRoles, authenticate } from "../middleware/auth.middleware";

const courseRouter = express.Router();
courseRouter.post("/create-course", authenticate, authorizeRoles("admin"), uploadCourse);
courseRouter.put("/edit-course/:id", authenticate, authorizeRoles("admin"), editCourse);

export default courseRouter;