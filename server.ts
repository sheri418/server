import { app } from "./app";
import dotenv from "dotenv";
import connectDB from "./utils/db";

dotenv.config(); // Load environment variables from .env file

const PORT = Number(process.env.PORT) || 8000; // Convert to number and use default if necessary

// Create server and explicitly set it to listen on 127.0.0.1
app.listen(PORT, '127.0.0.1', () => {
   console.log(`Server is connected on http://127.0.0.1:${PORT}`);
   connectDB();
});
