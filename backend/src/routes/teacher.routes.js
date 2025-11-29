import express from "express";
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

export default router;
