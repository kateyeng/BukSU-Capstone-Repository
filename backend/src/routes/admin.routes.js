// routes/adminRoutes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import { setThesisStatus, editThesis } from "../controllers/adminThesis.controller.js";

const router = express.Router();

// All admin routes require admin auth
router.use(protect, requireRole("admin"));

/* ========== USERS ========== */
router.get("/users", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 500, 1000);
  const users = await User.find().select("-password").sort({ createdAt: -1 }).limit(limit);
  res.json({ users });
});

router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["student", "teacher", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "Role updated", user });
});

/* ========== THESIS (Projects) ========== */
// List all thesis/projects for moderation
router.get("/thesis", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 500, 1000);
  const thesis = await Project.find({}, "title category year authors status createdAt submitterEmail owner")
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ thesis });
});

// ✅ Use controller handlers that send emails & return { emailStatus }
router.patch("/thesis/:id/status", setThesisStatus);
router.patch("/thesis/:id", editThesis);

// Delete a thesis
router.delete("/thesis/:id", async (req, res) => {
  const doc = await Project.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
});

/* ========== METRICS (Dashboard) ========== */
router.get("/metrics", async (_req, res) => {
  const [projects, users, viewsAgg, pending, approved] = await Promise.all([
    Project.countDocuments(),
    User.countDocuments(),
    Project.aggregate([{ $group: { _id: null, views: { $sum: "$views" } } }]),
    Project.countDocuments({ status: "pending" }),
    Project.countDocuments({ status: "approved" }),
  ]);
  res.json({
    projects,
    users,
    totalViews: viewsAgg[0]?.views ?? 0,
    pending,
    approved,
  });
});

export default router;
