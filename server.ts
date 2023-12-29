import { app } from "./app";
import dotenv from "dotenv";
import connectDB from "./utils/db";

dotenv.config(); // Load environment variables from .env file

const PORT = process.env.PORT || 8000; // Use port from environment variable or default to 8000

// Create server
app.listen(PORT, () => {
   console.log(`Server is connected on port ${PORT}`);
   connectDB();
});