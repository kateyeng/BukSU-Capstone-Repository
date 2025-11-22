// routes/adminRoutes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";

const router = express.Router();

// All admin routes require admin auth
router.use(protect, requireRole("admin"));

/* ========== GET /api/admin/users ========== */
/**
 * Returns a list of users for the admin panel.
 * Response shape: { users: [...] }
 */
router.get("/users", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 500, 1000);

  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ users });
});

/* ========== UPDATE USER BASIC INFO ========== */
/**
 * PATCH /api/admin/users/:id
 * Body: { fullName?, email? }
 */
router.patch("/users/:id", async (req, res) => {
  const { fullName, email } = req.body;

  const update = {};
  if (typeof fullName === "string") update.fullName = fullName;
  if (typeof email === "string") update.email = email;

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
  }).select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User updated", user });
});

/* ========== DELETE USER ========== */
/**
 * DELETE /api/admin/users/:id
 */
router.delete("/users/:id", async (req, res) => {
  // Optional safety: prevent deleting your own account
  if (String(req.user._id) === String(req.params.id)) {
    return res
      .status(400)
      .json({ message: "You cannot delete your own account." });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ message: "User deleted" });
});

/* ========== METRICS (Dashboard) ========== */
/**
 * GET /api/admin/metrics
 */
router.get("/metrics", async (_req, res) => {
  const [
    projects,
    users,
    viewsAgg,
    pending,
    approved,
    rejected,
    usersByRoleAgg,
  ] = await Promise.all([
    Project.countDocuments(),
    User.countDocuments(),
    Project.aggregate([{ $group: { _id: null, views: { $sum: "$views" } } }]),
    Project.countDocuments({ status: "pending" }),
    Project.countDocuments({ status: "approved" }),
    Project.countDocuments({ status: "rejected" }),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
  ]);

  const totalViews = viewsAgg[0]?.views ?? 0;

  // Normalize for all possible roles from your schema
  const usersByRole = { guest: 0, student: 0, teacher: 0, admin: 0 };
  usersByRoleAgg.forEach((r) => {
    usersByRole[r._id] = r.count;
  });

  res.json({
    projects,
    users,
    totalViews,
    pending,
    approved,
    rejected,
    usersByRole,
  });
});

export default router;
