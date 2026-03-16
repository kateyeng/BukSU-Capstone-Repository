// backend/src/routes/public.routes.js
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import Project from "../models/project.model.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* ============== Multer setup (local temp storage) ============== */
const uploadDir = path.join(process.cwd(), "uploads", "projects");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
    cb(null, `${ts}__${safe}`);
  },
});

const fileFilter = (_req, file, cb) =>
  file.mimetype === "application/pdf"
    ? cb(null, true)
    : cb(new Error("Only PDF files are allowed."));

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

/* ============== Helpers ============== */
const toAbsolute = (fp) =>
  path.isAbsolute(fp) ? fp : path.join(process.cwd(), fp);

const getRequesterId = (req) =>
  req?.user?._id || req?.headers?.["x-user-id"] || req?.body?.owner || null;

function getOwnerIdFromDoc(doc) {
  const o = doc && doc.owner;
  if (!o) return null;
  if (typeof o === "object" && o._id) return String(o._id);
  return String(o);
}

/* ============== CREATE (PUBLIC UPLOAD ENDPOINT) ============== */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const { title, authors, adviser, department, year, abstract, keywords } =
      req.body;

    if (!title || !authors || !department || !year || !abstract) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "buksu-thesis",
      resource_type: "raw",
    });

    fs.unlink(req.file.path, () => {});

    const ownerId = getRequesterId(req);

    const tags = String(keywords || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const doc = await Project.create({
      title: String(title).trim(),
      category: String(department).trim(),
      year: Number(year),
      abstract: String(abstract).trim(),
      authors: String(authors)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      adviser: adviser ? String(adviser).trim() : undefined,
      ...(ownerId ? { owner: ownerId } : {}),

      filePath: undefined,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,

      tags,
      status: "pending",
    });

    res.status(201).json({ project: doc.toPublic ? doc.toPublic() : doc });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

/* ============== LIST / SEARCH (approved by default) ============== */
// Used by: GET /api/publicProjects
router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      page = 1,
      limit = 12,
      category,
      year,
      status,
      mine,
    } = req.query;

    let statusFilter;
    if (status) {
      statusFilter = new RegExp(`^${String(status).trim()}$`, "i");
    } else {
      statusFilter = /^approved$/i;
    }

    const filter = {
      status: statusFilter,
    };

    if (category) filter.category = category;
    if (year) filter.year = Number(year);

    const ownerId = getRequesterId(req);
    if (mine === "1" && ownerId) {
      filter.owner = ownerId;
    }

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { title: regex },
        { abstract: regex },
        { authors: regex },
        { tags: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select(
          "title category year authors abstract tags keywords views status fileUrl filePath"
        )
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (e) {
    console.error("Projects list error:", e);
    res.status(500).json({ error: "Failed to load projects" });
  }
});

/* ============== STATS (PUBLIC) ============== */
// Used by: GET /api/publicProjects/stats
router.get("/stats", async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const approvedFilter = {
      status: /^approved$/i,
      isPublished: { $ne: false },
    };

    const [total, latestUploads] = await Promise.all([
      Project.countDocuments(approvedFilter),
      Project.countDocuments({
        ...approvedFilter,
        createdAt: { $gte: weekAgo },
      }),
    ]);

    res.json({ total, latestUploads });
  } catch (e) {
    console.error("Stats route error:", e);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

/* ============== DETAILS ============== */
// GET /api/publicProjects/:id
router.get("/:id", async (req, res) => {
  try {
    const p = await Project.findById(req.params.id);

    console.log("[public.details] id =", req.params.id, "doc?", !!p);

    if (!p) return res.status(404).json({ message: "Not found" });

    res.json(p.toPublic ? p.toPublic() : p);
  } catch (e) {
    console.error("Details error:", e);
    res.status(500).json({ error: "Failed to load project" });
  }
});

/* ============== DOWNLOAD ============== */
// GET /api/publicProjects/:id/download
router.get("/:id/download", async (req, res) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) {
      return res.status(404).json({ message: "File not found" });
    }

    if (p.fileUrl) {
      return res.redirect(p.fileUrl);
    }

    if (p.filePath && p.filePath.startsWith("http")) {
      return res.redirect(p.filePath);
    }

    if (p.filePath) {
      const abs = toAbsolute(p.filePath);
      return res.download(abs);
    }

    return res.status(404).json({ message: "File not found" });
  } catch (e) {
    console.error("Download error:", e);
    res.status(500).json({ error: "Failed to download file" });
  }
});

export default router;
