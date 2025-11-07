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

export default router;
