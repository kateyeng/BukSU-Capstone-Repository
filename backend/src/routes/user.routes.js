// backend/src/routes/user.routes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import { getTeachers } from "../controllers/user.controller.js";

const router = express.Router();

// Any logged-in user (student/teacher/admin) can see the advisers list
router.use(protect);

// GET /api/users/teachers
router.get("/teachers", getTeachers);

export default router;
