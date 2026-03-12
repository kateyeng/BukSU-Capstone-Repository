import express from "express";
import { protect } from "../middleware/auth.js";
import UserActivity from "../models/userActivity.model.js";

const router = express.Router();

// Logs activity for logged-in users
router.post("/", protect, async (req, res) => {
  try {
    const { action, meta } = req.body;

    if (!action) {
      return res.status(400).json({ message: "action is required" });
    }

    const user = req.user;

    await UserActivity.create({
      user: user._id,
      action,
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
      meta: meta || {},
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("activity log error:", err);
    return res.status(500).json({ message: "Failed to log activity" });
  }
});

export default router;
