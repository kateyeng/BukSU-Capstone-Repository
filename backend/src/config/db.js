import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URI, {
      dbName: process.env.MONGO_DB_NAME || "test",
      serverSelectionTimeoutMS: 30000,
    });
    console.log("MONGODB CONNECTED SUCCESSFULLY!");
  } catch (error) {
    console.error("Error connecting to MONGODB", error);
    process.exit(1);
  }
};