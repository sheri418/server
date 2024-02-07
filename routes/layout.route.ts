import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware"; // Corrected import statement
import { createLayout } from "../controllers/layout.controller"; // Ensure this path correctly points to your layout controller

const layoutRouter = express.Router();

layoutRouter.post("/create-layout", authenticate, authorizeRoles("admin"), createLayout);

export default layoutRouter;
