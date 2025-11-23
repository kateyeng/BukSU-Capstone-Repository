// routes/adminRoutes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";

import {
  getAdminUsers,
  updateUserBasic,
  updateUserRole,
  deleteUser,
  lockUserEditing,
  unlockUserEditing,
  getAdminMetrics,
} from "../controllers/adminUserController.js";

const router = express.Router();

// All admin routes require admin auth
router.use(protect, requireRole("admin"));

/* ========== USERS MANAGEMENT ========== */

// GET /api/admin/users  -> list users for admin panel
router.get("/users", getAdminUsers);

// PATCH /api/admin/users/:id  -> update name/email
router.patch("/users/:id", updateUserBasic);

// PATCH /api/admin/users/:id/role  -> update role (student/teacher/admin)
router.patch("/users/:id/role", updateUserRole);

// DELETE /api/admin/users/:id  -> delete user
router.delete("/users/:id", deleteUser);

// POST /api/admin/users/:id/lock   -> acquire / refresh edit lock
router.post("/users/:id/lock", lockUserEditing);

// POST /api/admin/users/:id/unlock -> release edit lock
router.post("/users/:id/unlock", unlockUserEditing);

/* ========== DASHBOARD METRICS ========== */

// GET /api/admin/metrics  -> used by AdminDashboard.jsx
router.get("/metrics", getAdminMetrics);

export default router;
