import mongoose from "mongoose";

export const connectDB = async () => {
    try{
<<<<<<< HEAD
        await mongoose.connect(process.env.MONGODB_URI);
=======
        await mongoose.connect(process.env.atlas_URI);
>>>>>>> major-changes

        console.log("MONGODB CONNECTED SUCCESSFULY!");
    } catch(error) {
        console.error("Error connecting to MONGODB",error);
        process.exit(1);//auto exit when failed to connect to the database
    }
}