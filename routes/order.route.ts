import express from "express"; // Correctly import express
import { authenticate,authorizeRoles } from "../middleware/auth.middleware";
import { createOrder, getAllOrders } from "../controllers/order.controller";

// Correct initialization of the router
const orderRouter = express.Router();

// Setup the route
orderRouter.post("/create-order", authenticate, createOrder);
orderRouter.get("/get-orders", authenticate, authorizeRoles("admin"), getAllOrders);

export default orderRouter;
