import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import { getNotifications, updateNotification } from "../controllers/notification.controller";

const notificationRoute = express.Router();

notificationRoute.get(
    "/get-all-notifications", 
    authenticate, 
    authorizeRoles("admin"), 
    getNotifications
);
notificationRoute.put("/update-notification/:id",authenticate, authorizeRoles("admin"),updateNotification)
export default notificationRoute;
