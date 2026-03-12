// backend/src/routes/rbac.public.routes.js
import express from "express";
import { canRole } from "../config/rbac.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/guest-permissions", async (req, res) => {
  try {
    const canDownloadProject = await canRole("guest", "project", "download");

    return res.json({
      success: true,
      permissions: {
        project: {
          download: canDownloadProject,
        },
      },
    });
  } catch (err) {
    console.error("RBAC guest-permissions error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load guest permissions",
    });
  }
});

router.get("/my-permissions", protect, async (req, res) => {
  try {
    const role = String(req.user?.role || "guest").toLowerCase();

    const permissions = {
      project: {
        create: await canRole(role, "project", "create"),
        read: await canRole(role, "project", "read"),
        update: await canRole(role, "project", "update"),
        delete: await canRole(role, "project", "delete"),
        download: await canRole(role, "project", "download"),
      },
      bookmark: {
        create: await canRole(role, "bookmark", "create"),
        delete: await canRole(role, "bookmark", "delete"),
      },
      thesis: {
        view: await canRole(role, "thesis", "view"),
        approve: await canRole(role, "thesis", "approve"),
        reject: await canRole(role, "thesis", "reject"),
        edit: await canRole(role, "thesis", "edit"),
      },
      user: {
        read: await canRole(role, "user", "read"),
        update: await canRole(role, "user", "update"),
        delete: await canRole(role, "user", "delete"),
      },
    };

    return res.json({
      success: true,
      role,
      permissions,
    });
  } catch (err) {
    console.error("RBAC my-permissions error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load permissions",
    });
  }
});

export default router;