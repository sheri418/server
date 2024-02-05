import express from "express";
import { addAnswer, addQuestion, addReview, editCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse, addReplyToReview } from "../controllers/course.controller"; 
import { authorizeRoles, authenticate } from "../middleware/auth.middleware";

const courseRouter = express.Router();
courseRouter.post("/create-course", authenticate, authorizeRoles("admin"), uploadCourse);
courseRouter.put("/edit-course/:id", authenticate, authorizeRoles("admin"), editCourse);
courseRouter.get("/get-course/:id",  getSingleCourse);
courseRouter.get("/get-courses",  getAllCourses);

courseRouter.get("/get-course-content/:id",authenticate , getCourseByUser);
courseRouter.put("/add-question",authenticate , addQuestion);
courseRouter.put("/add-answer",authenticate , addAnswer);
courseRouter.put("/add-review/:id",authenticate , addReview);
courseRouter.put("/reply-review",authenticate ,authorizeRoles("admin") ,addReplyToReview);


export default courseRouter;
