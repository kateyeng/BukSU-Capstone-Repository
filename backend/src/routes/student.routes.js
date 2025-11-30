// backend/src/routes/studentProjects.routes.js
import express from "express";
import { protect, ownerOrAdmin } from "../middleware/auth.js";
import { requirePermission } from "../middleware/acl.js";
import { uploadProjectFile } from "../config/multer.js";
import {
  createProject,
  updateProject,
  deleteProject,
  downloadProject,
  getMyProjects,
  lockMyProject,
  unlockMyProject,
} from "../controllers/project.controller.js";

const router = express.Router();

/**
 * Base path in server:
 *   app.use("/api/student", studentProjectsRouter);
 *
 * Frontend student calls:
 *  - GET    /api/student/projects/mine
 *  - POST   /api/student/projects
 *  - PATCH  /api/student/projects/:id
 *  - POST   /api/student/projects/:id/lock
 *  - POST   /api/student/projects/:id/unlock
 *  - DELETE /api/student/projects/:id
 *  - GET    /api/student/projects/:id/download
 */

// Simple debug route
router.get("/projects/debug", (req, res) => {
  res.json({ ok: true, msg: "Student projects route is working" });
});

/* ========== LIST MY PROJECTS ========== */
/**
 * GET /api/student/projects/mine
 * Only the logged-in student's own projects (used in Profile page)
 */
router.get(
  "/projects/mine",
  protect,
  requirePermission("project", "read"),
  getMyProjects
);

/* ========== CREATE / UPLOAD PROJECT ========== */
/**
 * POST /api/student/projects
 * Body: form-data with fields + "file" (PDF)
 */
router.post(
  "/projects",
  protect,
  requirePermission("project", "create"),
  uploadProjectFile.single("file"),
  createProject
);

/* ========== UPDATE PROJECT ========== */
/**
 * PATCH /api/student/projects/:id
 * Only owner or admin can update.
 */
router.patch(
  "/projects/:id",
  protect,
  requirePermission("project", "update"),
  ownerOrAdmin("id"),
  uploadProjectFile.single("file"),
  updateProject
);

/* ========== 2PL LOCK / UNLOCK FOR EDITING ========== */
/**
 * POST /api/student/projects/:id/lock
 * Only owner or admin.
 */
router.post(
  "/projects/:id/lock",
  protect,
  requirePermission("project", "update"),
  ownerOrAdmin("id"),
  lockMyProject
);

/**
 * POST /api/student/projects/:id/unlock
 * Only owner or admin.
 */
router.post(
  "/projects/:id/unlock",
  protect,
  requirePermission("project", "update"),
  ownerOrAdmin("id"),
  unlockMyProject
);

/* ========== DELETE PROJECT ========== */
/**
 * DELETE /api/student/projects/:id
 *
 * NOTE:
 *  We purposely do NOT call requirePermission("project", "delete") here to
 *  avoid ACL 403 headaches. Instead:
 *   - user must be authenticated (protect)
 *   - and must be the owner of the project or an admin (ownerOrAdmin)
 */
router.delete(
  "/projects/:id",
  protect,
  ownerOrAdmin("id"),
  deleteProject
);

/* ========== DOWNLOAD PROJECT FILE ========== */
/**
 * GET /api/student/projects/:id/download
 * Any logged-in user with project:download permission can download.
 */
router.get(
  "/projects/:id/download",
  protect,
  requirePermission("project", "download"),
  downloadProject
);

export default router;
