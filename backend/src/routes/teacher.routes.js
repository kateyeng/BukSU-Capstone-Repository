import express from "express";
<<<<<<< HEAD
import multer from "multer";
import { protect, requireRole, ownerOrAdmin } from "../middleware/auth.js";
import Project from "../models/project.model.js";
import { uploadProjectFile } from "../config/multer.js";
import { createProject, downloadProject } from "../controllers/project.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/projects" }); // configure storage as needed

// create/upload
router.post(
  "/projects",
  protect,
  requireRole("teacher", "admin"),
  upload.single("file"),
  async (req, res) => {
    const { title, category, year, abstract, authors = [] } = req.body;
    const project = await Project.create({
      title,
      category,
      year,
      abstract,
      authors: Array.isArray(authors) ? authors : String(authors).split(",").map(s=>s.trim()),
      owner: req.user._id,
      filePath: req.file?.path || null,
    });
    res.status(201).json(project);
  }
);

// update (owner or admin)
router.patch(
  "/projects/:id",
  protect,
  requireRole("teacher", "admin"),
  ownerOrAdmin("id"),
  upload.single("file"),
  async (req, res) => {
    const { title, category, year, abstract, authors } = req.body;
    const update = {
      ...(title && { title }),
      ...(category && { category }),
      ...(year && { year }),
      ...(abstract && { abstract }),
      ...(authors && { authors: Array.isArray(authors) ? authors : String(authors).split(",").map(s=>s.trim()) }),
      ...(req.file && { filePath: req.file.path }),
    };
    const proj = await Project.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!proj) return res.status(404).json({ message: "Not found" });
    res.json(proj);
  }
);

// delete (owner or admin)
router.delete(
  "/projects/:id",
  protect,
  requireRole("teacher", "admin"),
  ownerOrAdmin("id"),
  async (req, res) => {
    const proj = await Project.findByIdAndDelete(req.params.id);
    if (!proj) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  }
);

// Upload a new project (teacher/admin)
router.post(
  "/projects",
  protect,
  requireRole("teacher", "admin"),
  uploadProjectFile.single("file"), // form field name = "file"
  createProject
);

// Optional download by id (anyone or guard if needed)
router.get("/projects/:id/download", downloadProject);
=======
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

// All teacher routes require login with role "teacher" OR "admin"
router.use(protect, requireRole("teacher", "admin"));

/* THESIS LIST (VIEW) */
router.get(
  "/thesis",
  requirePermission("thesis", "view"),
  async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 500, 1000);
      const status = req.query.status;

      const filter = {};
      if (status && status !== "all") filter.status = status;
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

/* STATUS UPDATE */
router.patch(
  "/thesis/:id/status",
  requirePermission("thesis", "approve"),
  setThesisStatus
);

/* EDIT CONTENT */
router.patch(
  "/thesis/:id",
  requirePermission("thesis", "edit"),
  editThesis
);

/* 2PL LOCK / UNLOCK */
router.post(
  "/thesis/:id/lock",
  requirePermission("thesis", "edit"),
  lockThesis
);

router.post(
  "/thesis/:id/unlock",
  requirePermission("thesis", "edit"),
  unlockThesis
);

/* DELETE (optional, mostly admin) */
router.delete(
  "/thesis/:id",
  requirePermission("project", "delete"),
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

router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "teacher router is mounted" });
});
>>>>>>> major-changes

export default router;
