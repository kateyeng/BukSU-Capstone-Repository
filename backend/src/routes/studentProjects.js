// routes/studentProjects.js
import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js"; // adjust path
import {
    uploadProject,
    getMyProjects,
} from "../controllers/student/projectController.js"; // adjust path

const router = express.Router();

// existing upload route
router.post(
    "/projects",
    requireAuth,
    requireRole("student"),
    uploadProject
);

// ✅ NEW: get all projects uploaded by this student
router.get(
    "/projects/mine",
    requireAuth,
    requireRole("student"),
    getMyProjects
);

export default router;
