import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  status: string;
  userId: mongoose.Schema.Types.ObjectId; // Adjusted type
}

const notificationSchema = new Schema<INotification>({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: "unread"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Adjusted type
    required: true,
    ref: 'User' // Add this if you wish to reference the User collection
  }
}, { timestamps: true });

const NotificationModel: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);

export default NotificationModel;
