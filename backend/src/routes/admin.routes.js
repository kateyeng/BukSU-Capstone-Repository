// backend/src/routes/admin.routes.js
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

import {
  getAdminPermissions,
  updateAdminPermissions,
} from "../controllers/adminPermissions.controller.js";

const router = express.Router();

// All admin routes require admin auth
router.use(protect, requireRole("admin"));

/* ========== USERS MANAGEMENT ========== */

router.get("/users", getAdminUsers);
router.patch("/users/:id", updateUserBasic);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/lock", lockUserEditing);
router.post("/users/:id/unlock", unlockUserEditing);

/* ========== DASHBOARD METRICS ========== */

router.get("/metrics", getAdminMetrics);

/* ========== ROLE PERMISSIONS ========== */

// GET /api/admin/permissions  -> RolePermissions table
router.get("/permissions", getAdminPermissions);

// PUT /api/admin/permissions  -> Save changes from RolePermissions
router.put("/permissions", updateAdminPermissions);

export default router;
