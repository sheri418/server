import mongoose, { Document, Model, Schema } from "mongoose";

// Define an interface for the Order document that extends mongoose.Document
export interface IOrder extends Document {
  courseId: string;
  userId: string;
  payment_info: any; // Consider defining a more specific type for payment_info if possible
}

// Define the schema for the Order document
const orderSchema = new Schema<IOrder>({
  courseId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  payment_info: {
    type: Schema.Types.Mixed, // Use Schema.Types.Mixed for arbitrary object types
    required: true, // Uncomment or adjust based on your requirements
  },
}, { timestamps: true });

// Create the model from the schema and export it
const OrderModel: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default OrderModel;
