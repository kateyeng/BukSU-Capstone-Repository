// routes/publicProjects.js
import express from "express";
import Project from "../models/project.model.js";

const router = express.Router();

// list/search
router.get("/", async (req, res) => {
  const { q = "", page = 1, limit = 12, category, year } = req.query;
  const filter = {
    ...(q ? { title: { $regex: q, $options: "i" } } : {}),
    ...(category ? { category } : {}),
    ...(year ? { year: Number(year) } : {}),
  };
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("title category year authors views"),
    Project.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// details
router.get("/:id", async (req, res) => {
  const p = await Project.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json(p);
});

// download (public)
router.get("/:id/download", async (req, res) => {
  const p = await Project.findById(req.params.id);
  if (!p || !p.filePath) return res.status(404).json({ message: "File not found" });
  // optionally increment downloads/views
  // p.downloads = (p.downloads || 0) + 1; await p.save();
  return res.download(p.filePath); // or res.sendFile(p.filePath)
});

export default router;
