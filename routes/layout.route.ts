import express from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware"; // Corrected import statement
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controller"; // Ensure this path correctly points to your layout controller

const layoutRouter = express.Router();

layoutRouter.post("/create-layout", authenticate, authorizeRoles("admin"), createLayout);
layoutRouter.put("/edit-layout", authenticate, authorizeRoles("admin"), editLayout);
// layoutRouter.get("/get-layout",   getLayoutByType);
layoutRouter.get("/get-layout/:type",   getLayoutByType);
export default layoutRouter;
