// backend/src/routes/admin.routes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { requirePermission } from "../middleware/acl.js";
import Project from "../models/project.model.js";

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

/**
 * Base path: app.use("/api/admin", adminRouter);
 *
 * NOTE:
 *  - Delete of thesis from admin UI goes through /api/teacher/thesis/:id
 *    (teacher router) so admins reuse the same logic & permissions.
 *  - We still provide GET /api/admin/thesis for the admin Capstone list.
 */

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

/* ========== THESIS / CAPSTONE LIST (ADMIN) ========== */
/**
 * GET /api/admin/thesis?status=pending|approved|rejected|all&limit=500
 * Admin view of all thesis/capstone projects.
 */
router.get(
  "/thesis",
  requirePermission("thesis", "view"),
  async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 500, 1000);
      const status = req.query.status;

      const filter = {};
      if (status && status !== "all") filter.status = status;

      const thesis = await Project.find(
        filter,
        // keep department in projection (string or whatever you store)
        "title category year abstract authors adviser department status createdAt fileUrl cloudinaryPublicId tags editLock"
      )
        .populate({
          path: "adviser",
          select: "name fullName firstName lastName department",
        })
        .sort({ createdAt: -1 })
        .limit(limit);

      res.json({ thesis });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
