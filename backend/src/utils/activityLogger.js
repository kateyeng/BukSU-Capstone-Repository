// backend/src/utils/activityLogger.js
import UserActivity from "../models/userActivity.model.js";

export async function logActivity(req, action, meta = {}, userDoc = null) {
  try {
    const user = userDoc || req.user || null;

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      "";

    const userAgent = req.headers["user-agent"] || "";

    await UserActivity.create({
      user: user?._id || null,
      action,
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
      ip,
      userAgent,
      meta,
    });
  } catch (err) {
    console.error("[logActivity] error:", err.message);
  }
}
