// backend/src/server.js
import "dotenv/config";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import mongoose from "mongoose";
import multer from "multer";

import { connectDB } from "./config/db.js";
import "./config/passport.js";

// Routes
import publicRoutes from "./routes/public.routes.js";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import studentProjects from "./routes/studentProject.routes.js";
import bookmarksRouter from "./routes/bookmarks.routes.js";
import publicRbacRoutes from "./routes/rbac.public.routes.js";
import adminActivityRoutes from "./routes/adminActivity.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import commentsRoutes from "./routes/comments.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import supportRoutes from "./routes/support.routes.js";

import Project from "./models/project.model.js";
import adminRbacRoutes from "./routes/admin.rbac.routes.js";
import { loadRbacFromDB } from "./config/rbac.js";

const app = express();

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

/* =========================================================
   DATABASE
========================================================= */
await connectDB();
await loadRbacFromDB();
console.log("RBAC loaded from database.");
/* DEV ONLY: Sync indexes safely */
if (NODE_ENV === "development") {
  mongoose.connection.once("open", async () => {
    try {
      const existing = await Project.collection.indexes();
      console.log("Project indexes BEFORE:", existing);

      await Project.collection.dropIndexes();
      console.log("Project indexes dropped (non-_id).");

      const sync = await Project.syncIndexes();
      console.log("Project indexes synced:", sync);

      const after = await Project.collection.indexes();
      console.log("Project indexes AFTER:", after);
    } catch (e) {
      console.error("Index sync error:", e);
    }
  });
}

/* =========================================================
   CORE MIDDLEWARE
========================================================= */
app.set("trust proxy", 1);

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ ONE CORS ONLY (credentials + exact origin)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-User-Id",
      "X-Uploader-Role",
    ],
  })
);

// ✅ Preflight
app.options(/.*/, cors({ origin: CLIENT_URL, credentials: true }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  next();
});

/* =========================================================
   SIMPLE RATE LIMIT (Memory-based)
========================================================= */
const requestBuckets = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 400;

app.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  req.clientIp = ip;

  const now = Date.now();
  const bucket = requestBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    requestBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }

  return next();
});

/* =========================================================
   SESSION + PASSPORT
========================================================= */
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

/* =========================================================
   STATIC FILES
========================================================= */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* =========================================================
   ROUTES
========================================================= */
app.use("/api/admin", backupRoutes);
app.use("/api/publicProjects", publicRoutes);
app.use("/api/bookmarks", bookmarksRouter);

app.use("/api/student", studentRoutes);
app.use("/api/student", studentProjects);

app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rbac", publicRbacRoutes);
app.use("/api/admin/activity", adminActivityRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/support", supportRoutes);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File size exceeds 50MB limit",
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error("[GLOBAL_ERROR]", err);

  return res.status(500).json({
    success: false,
    message: "Server error",
    error: err.message || "Unknown error",
  });
});

app.use("/api/admin/rbac", adminRbacRoutes);

/* =========================================================
   START SERVER
========================================================= */
app.disable("etag");

app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] Server is up on port: ${PORT}`);
  console.log(`CORS origin allowed: ${CLIENT_URL}`);
});