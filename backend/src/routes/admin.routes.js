<<<<<<< HEAD
// routes/adminRoutes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";

const router = express.Router();

router.get("/users", protect, requireRole("admin"), async (_req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

router.patch("/users/:id/role", protect, requireRole("admin"), async (req, res) => {
  const { role } = req.body;
  if (!["student","teacher","admin"].includes(role))
    return res.status(400).json({ message: "Invalid role" });

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "Role updated", user });
});

// moderation: remove any project
router.delete("/projects/:id", protect, requireRole("admin"), async (req, res) => {
  const proj = await Project.findByIdAndDelete(req.params.id);
  if (!proj) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
});

// metrics for dashboards
router.get("/metrics", protect, requireRole("admin"), async (_req, res) => {
  const [projects, users, viewsAgg] = await Promise.all([
    Project.countDocuments(),
    User.countDocuments(),
    Project.aggregate([{ $group: { _id: null, views: { $sum: "$views" } } }]),
  ]);
  res.json({ projects, users, totalViews: viewsAgg[0]?.views ?? 0 });
});
=======
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
 * GET /api/admin/thesis?status=pending&limit=500
 * Admin view of all thesis/capstone projects.
 * - optional ?status=pending|approved|rejected
 * - optional ?limit=number (default 500, max 1000)
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
        "title category year abstract authors adviser department status createdAt fileUrl cloudinaryPublicId tags editLock"
      )
        .sort({ createdAt: -1 })
        .limit(limit);

      res.json({ thesis });
    } catch (err) {
      next(err);
    }
  }
);
>>>>>>> major-changes

export default router;
