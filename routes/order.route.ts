import express from "express"; // Correctly import express
import { authenticate } from "../middleware/auth.middleware";
import { createOrder } from "../controllers/order.controller";

// Correct initialization of the router
const orderRouter = express.Router();

// Setup the route
orderRouter.post("/create-order", authenticate, createOrder);

export default orderRouter;
