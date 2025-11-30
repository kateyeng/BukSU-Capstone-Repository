// backend/src/routes/teacher.routes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { requirePermission } from "../middleware/acl.js";
import Project from "../models/project.model.js";
import {
  setThesisStatus,
  editThesis,
  lockThesis,
  unlockThesis,
} from "../controllers/teacherThesis.controller.js";

const router = express.Router();

/**
 * Base path in server: app.use("/api/teacher", teacherRouter);
 *
 * Frontend teacher/admin calls:
 *  - GET    /api/teacher/thesis?status=&limit=
 *  - PATCH  /api/teacher/thesis/:id/status      (approve / reject)
 *  - PATCH  /api/teacher/thesis/:id             (edit thesis fields)
 *  - POST   /api/teacher/thesis/:id/lock        (2PL lock)
 *  - POST   /api/teacher/thesis/:id/unlock      (2PL unlock)
 *  - DELETE /api/teacher/thesis/:id             (delete thesis)
 */

// All teacher routes require login with role "teacher" OR "admin"
router.use(protect, requireRole("teacher", "admin"));

/* ========== THESIS LIST (VIEW) ========== */
/**
 * GET /api/teacher/thesis?status=pending|approved|rejected|all&limit=500
 *
 * - Teachers see only their own advisees (filter.adviser = req.user._id)
 * - Admin sees all thesis
 */
router.get(
  "/thesis",
  requirePermission("thesis", "view"),
  async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 500, 1000);
      const status = req.query.status;

      const filter = {};
      if (status && status !== "all") filter.status = status;

      // teachers only see their advisees
      if (req.user?.role === "teacher") {
        filter.adviser = req.user._id;
      }

      const thesis = await Project.find(
        filter,
        "title category year authors status createdAt submitterEmail owner adviser editLock"
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
/**
 * PATCH /api/teacher/thesis/:id/status
 * Body: { status: "approved"|"rejected", reason?: string }
 */
router.patch(
  "/thesis/:id/status",
  requirePermission("thesis", "approve"),
  setThesisStatus
);

/* ========== EDIT CONTENT ========== */
/**
 * PATCH /api/teacher/thesis/:id
 * Body: { title, category, year, abstract, authors, adviser, department, tags, ... }
 */
router.patch(
  "/thesis/:id",
  requirePermission("thesis", "edit"),
  editThesis
);

/* ========== 2PL LOCK / UNLOCK ========== */
/**
 * POST /api/teacher/thesis/:id/lock
 */
router.post(
  "/thesis/:id/lock",
  requirePermission("thesis", "edit"),
  lockThesis
);

/**
 * POST /api/teacher/thesis/:id/unlock
 */
router.post(
  "/thesis/:id/unlock",
  requirePermission("thesis", "edit"),
  unlockThesis
);

/* ========== DELETE (SHARED FOR TEACHER+ADMIN) ========== */
/**
 * DELETE /api/teacher/thesis/:id
 *
 * Used by:
 *  - Teacher Thesis page
 *  - Admin Capstone page (Capstone.jsx) via /api/teacher/thesis/:id
 *
 * NOTE:
 *  We do NOT use requirePermission here to avoid ACL 403 issues.
 *  Instead:
 *    - admin can delete any thesis
 *    - teacher can delete only thesis where adviser == teacher._id
 */
router.delete("/thesis/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build filter: always match by _id
    const filter = { _id: id };

    // If current user is a teacher, restrict to their advisees
    if (req.user.role === "teacher") {
      filter.adviser = req.user._id;
    }

    const doc = await Project.findOne(filter);

    if (!doc) {
      // Could be "not found" or "not your advisee"
      return res
        .status(404)
        .json({ message: "Thesis not found or not allowed to delete." });
    }

    await doc.deleteOne();

    return res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

/* Simple ping route for debugging */
router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "teacher router is mounted" });
});

export default router;
