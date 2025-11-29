import express from "express"; 
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from 'cors';
import studentRoutes from './routes/public.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import './config/passport.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT

connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);


//middleware
app.use(express.json());
app.use(morgan("dev")); //middleware for debugging
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());


app.use('/api/projects', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);


app.listen(PORT, () => {
    console.log("Server is up on port:", PORT);
});