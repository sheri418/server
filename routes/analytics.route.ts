import  express  from "express";
import { authenticate,authorizeRoles } from '../middleware/auth.middleware';
import { getCourseAnalytics, getUsersAnalytics, getOrderAnalytics } from '../controllers/analytics.controller';
const analyticsRouter=express.Router();


analyticsRouter.get("/get-user-analytics",authenticate,authorizeRoles("admin"),getUsersAnalytics);
analyticsRouter.get("/get-course-analytics",authenticate,authorizeRoles("admin"),getCourseAnalytics);
analyticsRouter.get("/get-order-analytics",authenticate,authorizeRoles("admin"),getOrderAnalytics);
export default analyticsRouter;