import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { loadEnvConfig } from './env.js';

dotenv.config();
loadEnvConfig();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 6+ doesn't need these options, but including for clarity
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
