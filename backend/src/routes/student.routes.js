// backend/src/routes/student.routes.js
import express from "express";
import { protect, ownerOrAdmin } from "../middleware/auth.js";
import { requirePermission } from "../middleware/acl.js";
import { uploadProjectFile } from "../config/multer.js";
import {
  createProject,
  updateProject,
  deleteProject,
  downloadProject,
} from "../controllers/project.controller.js";

const router = express.Router();

// Debug route (optional)
router.get("/projects/debug", (req, res) => {
  res.json({ ok: true, msg: "Student projects route is working" });
});

// CREATE / upload project  (student + admin via RBAC)
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
