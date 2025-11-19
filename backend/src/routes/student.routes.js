// backend/src/routes/teacher.routes.js
import express from "express";
import { protect, requireRole, ownerOrAdmin } from "../middleware/auth.js";
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

// CREATE / upload project
router.post(
  "/projects",
  protect,
  requireRole("student", "admin"),
  uploadProjectFile.single("file"),
  createProject
);

// UPDATE
router.patch(
  "/projects/:id",
  protect,
  requireRole("student", "admin"),
  ownerOrAdmin("id"),
  uploadProjectFile.single("file"),
  updateProject
);

// DELETE
router.delete(
  "/projects/:id",
  protect,
  requireRole("student", "admin"),
  ownerOrAdmin("id"),
  deleteProject
);

// DOWNLOAD
router.get("/projects/:id/download", downloadProject);

export default router;
