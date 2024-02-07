import  express  from "express";
import { authenticate,authorizeRoles } from '../middleware/auth.middleware';
import { getUsersAnalytics } from "../controllers/analytics.controller";
const analyticsRouter=express.Router();


analyticsRouter.get("/get-user-analytics",authenticate,authorizeRoles("admin"),getUsersAnalytics);

export default analyticsRouter;