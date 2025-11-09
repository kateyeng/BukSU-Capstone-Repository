import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        await mongoose.connect(process.env.atlas_URI);

        console.log("MONGODB CONNECTED SUCCESSFULY!");
    } catch(error) {
        console.error("Error connecting to MONGODB",error);
        process.exit(1);//auto exit when failed to connect to the database
    }
}