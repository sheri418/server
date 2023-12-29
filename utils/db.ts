import mongoose from 'mongoose';
require('dotenv').config();

const dbUrl:string=process.env.DB_URL || '';

const connectDB = async () => {
    try {
      const connection = await mongoose.connect(dbUrl, {
        
      });
      console.log(`Connected to MongoDB : ${connection.connection.host}`);
    } catch (error) {
      console.error(error.message);
      setTimeout(connectDB, 5000);
    }
  };
  

export default connectDB;