import express from "express";
import { protect } from "../middleware/auth.js";
import NotificationSettings from "../models/notificationSettings.model.js";
import { logActivity } from "../utils/activityLogger.js";

const router = express.Router();

/**
 * All notification routes require authentication
 */
router.use(protect);

/**
 * GET /api/notifications/settings
 * Get current user's notification settings
 */
router.get("/settings", async (req, res, next) => {
  try {
    let settings = await NotificationSettings.findOne({ user: req.user._id });

    if (!settings) {
      // Create default settings if doesn't exist
      settings = await NotificationSettings.create({ user: req.user._id });
    }

    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/settings
 * Update current user's notification settings
 * Body: { emailOnApprove, emailOnReject, emailOnGrade, pushEnabled, digestFrequency, etc }
 */
router.patch("/settings", async (req, res, next) => {
  try {
    const updates = {};

    // Whitelist allowed fields
    const allowedFields = [
      "emailOnApprove",
      "emailOnReject",
      "emailOnGrade",
      "emailOnComment",
      "emailOnBackup",
      "emailOnSystemEvent",
      "digestFrequency",
      "pushEnabled",
    ];

    allowedFields.forEach((field) => {
      if (req.body.hasOwnProperty(field)) {
        updates[field] = req.body[field];
      }
    });

    let settings = await NotificationSettings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await NotificationSettings.create({ user: req.user._id, ...updates });
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }

    await logActivity(
      req,
      "notification_settings_update",
      { updates },
      req.user
    );

    res.json({
      message: "Notification settings updated",
      settings,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/admin
 * (ADMIN ONLY) View all system notifications/alerts
 */
router.get("/admin", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    // Return placeholder - in production, would query from a Notifications collection
    res.json({
      notifications: [
        {
          _id: "1",
          type: "backup_complete",
          message: "System backup completed successfully",
          severity: "info",
          createdAt: new Date(),
        },
        {
          _id: "2",
          type: "high_activity",
          message: "High system activity detected",
          severity: "warning",
          createdAt: new Date(Date.now() - 3600000),
        },
      ],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
