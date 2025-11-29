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

// Debug route (optional)
router.get("/projects/debug", (req, res) => {
  res.json({ ok: true, msg: "Student projects route is working" });
});

// Only the logged-in student's projects (used in Profile page)
router.get(
  "/projects/mine",
  protect,
  requirePermission("project", "read"),
  getMyProjects
);

// CREATE / upload project
router.post(
  "/projects",
  protect,
  requirePermission("project", "create"),
  uploadProjectFile.single("file"),
  createProject
);

// UPDATE
router.patch(
  "/projects/:id",
  protect,
  requirePermission("project", "update"),
  ownerOrAdmin("id"),
  uploadProjectFile.single("file"),
  updateProject
);

// 2PL LOCK for editing (student / owner / admin)
router.post(
  "/projects/:id/lock",
  protect,
  requirePermission("project", "update"),
  ownerOrAdmin("id"),
  lockMyProject
);

// 2PL UNLOCK
router.post(
  "/projects/:id/unlock",
  protect,
  requirePermission("project", "update"),
  ownerOrAdmin("id"),
  unlockMyProject
);

// DELETE
router.delete(
  "/projects/:id",
  protect,
  requirePermission("project", "delete"),
  ownerOrAdmin("id"),
  deleteProject
);

// DOWNLOAD
router.get(
  "/projects/:id/download",
  protect,
  requirePermission("project", "download"),
  downloadProject
);

export default router;
