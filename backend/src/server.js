// backend/src/server.js
import express from "express";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import publicRoutes from "./routes/public.routes.js";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import "./config/passport.js";
import bookmarksRouter from "./routes/bookmarks.routes.js";
import publicRbacRoutes from "./routes/rbac.public.routes.js"; // 👈 NEW

// index sync
import mongoose from "mongoose";
import Project from "./models/project.model.js";

dotenv.config();

const app = express();

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

connectDB();

// Optional: drop & sync non-_id indexes if you've had conflicts
mongoose.connection.once("open", async () => {
  try {
    try {
      const existing = await Project.collection.indexes();
      console.log("Project indexes BEFORE:", existing);
      await Project.collection.dropIndexes();
      console.log("Project indexes dropped (non-_id).");
    } catch {
      console.log("No pre-existing indexes to drop or dropIndexes skipped.");
    }
    const sync = await Project.syncIndexes();
    console.log("Project indexes synced:", sync);
    const after = await Project.collection.indexes();
    console.log("Project indexes AFTER:", after);
  } catch (e) {
    console.error("Index sync error:", e);
  }
});

// CORS (credentials + exact frontend origin)
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-User-Id",
      "X-Uploader-Role", // optional if you send it
    ],
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// app.set("trust proxy", 1); // if behind proxy

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// routes
app.use("/api/publicProjects", publicRoutes);
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rbac", publicRbacRoutes); // 👈 NEW

// start
app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] Server is up on port: ${PORT}`);
  console.log(`CORS origin allowed: ${CLIENT_URL}`);
});
