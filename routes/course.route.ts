import express from "express";
import { editCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller"; 
import { authorizeRoles, authenticate } from "../middleware/auth.middleware";

const courseRouter = express.Router();
courseRouter.post("/create-course", authenticate, authorizeRoles("admin"), uploadCourse);
courseRouter.put("/edit-course/:id", authenticate, authorizeRoles("admin"), editCourse);
courseRouter.get("/get-course/:id",  getSingleCourse);
courseRouter.get("/get-courses",  getAllCourses);

courseRouter.get("/get-course-content/:id",authenticate , getCourseByUser);

export default courseRouter;
