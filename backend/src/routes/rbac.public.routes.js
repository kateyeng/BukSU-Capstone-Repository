// backend/src/routes/rbac.public.routes.js
import express from "express";
import { canRole } from "../config/rbac.js";

const router = express.Router();

/**
 * Public RBAC info for the frontend.
 * Right now we only need to know if a GUEST can download a project.
 *
 * GET /api/rbac/guest-permissions
 * -> { canDownloadProject: true/false }
 */
router.get("/guest-permissions", async (req, res) => {
    try {
        const canDownloadProject = await canRole("guest", "project", "download");
        res.json({ canDownloadProject });
    } catch (err) {
        console.error("RBAC guest-permissions error:", err);
        res.status(500).json({ message: "Failed to load guest permissions" });
    }
});

export default router;
