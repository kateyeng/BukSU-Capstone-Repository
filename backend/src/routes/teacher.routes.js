// routes/teacher.routes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { requirePermission } from "../middleware/acl.js";
import Project from "../models/project.model.js";
import {
  setThesisStatus,
  editThesis,
} from "../controllers/teacherThesis.controller.js";

const router = express.Router();

// All teacher routes require login with role "teacher" OR "admin"
router.use(protect, requireRole("teacher", "admin"));

/* ========== THESIS LIST (VIEW) ========== */
// GET /api/teacher/thesis?status=pending
router.get(
  "/thesis",
  requirePermission("thesis", "view"),   // 👈 was project:read
  async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 500, 1000);
      const status = req.query.status; // optional ?status=pending

      const filter = {};
      if (status) filter.status = status;

      const thesis = await Project.find(
        filter,
        "title category year authors status createdAt submitterEmail owner"
      )
        .sort({ createdAt: -1 })
        .limit(limit);

      res.json({ thesis });
    } catch (err) {
      next(err);
    }
  }
);

/* ========== STATUS UPDATE (APPROVE / REJECT) ========== */
// PATCH /api/teacher/thesis/:id/status
// For now we treat both approve/reject as needing "thesis:approve".
router.patch(
  "/thesis/:id/status",
  requirePermission("thesis", "approve"),  // 👈 instead of project:update
  setThesisStatus
);

/* ========== EDIT THESIS CONTENT ========== */
// PATCH /api/teacher/thesis/:id
router.patch(
  "/thesis/:id",
  requirePermission("thesis", "edit"),     // 👈 instead of project:update
  editThesis
);

/* ========== DELETE THESIS (optional, mostly for admin) ========== */
router.delete(
  "/thesis/:id",
  requirePermission("project", "delete"),  // keep delete tied to project:delete (usually admin-only)
  async (req, res, next) => {
    try {
      const doc = await Project.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  }
);

// TEMP: quick check router is mounted
router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "teacher router is mounted" });
});

export default router;
