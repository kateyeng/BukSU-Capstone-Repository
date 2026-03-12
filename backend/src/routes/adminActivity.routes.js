// backend/src/routes/adminActivity.routes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import UserActivity from "../models/userActivity.model.js";
import PDFDocument from "pdfkit";

const router = express.Router();

// Only admins
router.use(protect, requireRole("admin"));

/**
 * ✅ CLEAN SUMMARY LIST
 * GET /api/admin/activity/users
 * Returns: one row per user (latest activity, counts)
 */
router.get("/users", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);

    const rows = await UserActivity.aggregate([
      { $sort: { createdAt: -1 } },

      // group by user id (null = unknown)
      {
        $group: {
          _id: "$user",
          fullName: { $first: "$fullName" },
          email: { $first: "$email" },
          role: { $first: "$role" },
          lastAction: { $first: "$action" },
          lastAt: { $first: "$createdAt" },
          total: { $sum: 1 },
        },
      },

      { $sort: { lastAt: -1 } },
      { $limit: limit },
    ]);

    return res.json({ users: rows });
  } catch (err) {
    console.error("GET /api/admin/activity/users error:", err);
    res.status(500).json({ message: "Failed to load activity users" });
  }
});

/**
 * ✅ DETAIL LOGS FOR ONE USER
 * GET /api/admin/activity/user/:userId?limit=200
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 200, 1000);

    const filter = {};
    if (userId === "unknown") filter.user = null;
    else filter.user = userId;

    const logs = await UserActivity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ logs });
  } catch (err) {
    console.error("GET /api/admin/activity/user/:userId error:", err);
    res.status(500).json({ message: "Failed to load user activity logs" });
  }
});

/**
 * (Optional) Keep this if your frontend still calls it:
 * GET /api/admin/activity?role=...&action=...&limit=...
 */
router.get("/", async (req, res) => {
  try {
    const { role, action, limit = 100 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (action) filter.action = action;

    const logs = await UserActivity.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Failed to load activity logs" });
  }
});

/**
 * ✅ EXPORT ACTIVITY LOGS AS PDF
 * GET /api/admin/activity/user/:userId/export-pdf?limit=500
 */
router.get("/user/:userId/export-pdf", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 500, 1000);

    const filter = {};
    if (userId === "unknown") filter.user = null;
    else filter.user = userId;

    const logs = await UserActivity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (!logs.length) {
      return res.status(400).json({ message: "No logs to export" });
    }

    // Get user info for header
    const firstLog = logs[0];
    const userName = firstLog.fullName || "Unknown User";
    const userEmail = firstLog.email || "—";
    const userRole = (firstLog.role || "—").toUpperCase();

    // Create PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="activity_${userName}_${new Date().toISOString().split("T")[0]}.pdf"`
    );

    // Pipe to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).font("Helvetica-Bold").text("Activity Log Report", { align: "center" });
    doc.moveDown(0.5);

    // User Info
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`User: ${userName}`, { indent: 20 })
      .text(`Email: ${userEmail}`, { indent: 20 })
      .text(`Role: ${userRole}`, { indent: 20 })
      .text(`Generated: ${new Date().toLocaleString("en-PH")}`, { indent: 20 })
      .text(`Total Logs: ${logs.length}`, { indent: 20 });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Table headers
    const pageWidth = doc.page.width - 100;
    const colWidths = {
      date: pageWidth * 0.35,
      action: pageWidth * 0.3,
      details: pageWidth * 0.35,
    };

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Date", 50, doc.y, { width: colWidths.date })
      .text("Action", 50 + colWidths.date, doc.y - 12, { width: colWidths.action })
      .text("Details", 50 + colWidths.date + colWidths.action, doc.y - 12, {
        width: colWidths.details,
      });

    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    const ACTION_LABELS = {
      login: "Login",
      logout: "Logout",
      login_failed: "Login Failed",
      view_details: "View Details",
      download_pdf: "Download PDF",
    };

    doc.fontSize(9).font("Helvetica");
    logs.forEach((log) => {
      const dateStr = new Date(log.createdAt).toLocaleString("en-PH");
      const actionStr = ACTION_LABELS[log.action] || log.action;
      const detailsStr = log.meta ? JSON.stringify(log.meta).substring(0, 50) : "—";

      const startY = doc.y;
      doc
        .text(dateStr, 50, startY, {
          width: colWidths.date,
          height: 40,
          ellipsis: true,
        })
        .text(actionStr, 50 + colWidths.date, startY, {
          width: colWidths.action,
          height: 40,
          ellipsis: true,
        })
        .text(detailsStr, 50 + colWidths.date + colWidths.action, startY, {
          width: colWidths.details,
          height: 40,
          ellipsis: true,
        });

      doc.moveDown(2.5);

      // Check if we need a new page
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }
    });

    // Footer
    doc.moveDown(1);
    doc.fontSize(8).text("© BUKSU Capstone Management System", { align: "center", color: "#999" });

    doc.end();
  } catch (err) {
    console.error("Export PDF error:", err);
    res.status(500).json({ message: "Failed to export logs as PDF" });
  }
});

export default router;
