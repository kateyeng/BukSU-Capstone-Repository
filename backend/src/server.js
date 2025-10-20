import express from "express"; 
import morgan from "morgan";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT

connectDB();

//middleware
app.use(express.json());
app.use(morgan("dev")); //middleware for debugging

app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);


app.listen(PORT, () => {
    console.log("Server is up on port:", PORT);
});