// backend/src/routes/public.routes.js
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import Project from "../models/project.model.js";
import cloudinary from "../config/cloudinary.js";
import { protect } from "../middleware/auth.js";

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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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
// NOTE: you are also creating projects via project.controller.js for
// student/teacher upload; this route is kept for your older public upload flow.
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

    // 1) Upload the file to Cloudinary (raw PDF)
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "buksu-thesis",
      resource_type: "raw",
    });

    // Delete local temp file
    fs.unlink(req.file.path, () => { });

    const ownerId = getRequesterId(req);

    const tags = String(keywords || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // 2) Save document in DB
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

      // file metadata
      filePath: undefined,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,

      // tagging + status
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

    // case-insensitive status, default = "approved"
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

    // If ?mine=1 and we know the owner, filter by owner
    const ownerId = getRequesterId(req);
    if (mine === "1" && ownerId) {
      filter.owner = ownerId;
    }

    // Optional backend search (title + abstract + authors + tags)
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
        // IMPORTANT: include fields we search on in the frontend
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

/* ============== STATS (approved-only by default) ============== */
router.get("/stats", protect, async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const mine = req.query.mine === "1";
    const approvedOnly = req.query.approvedOnly !== "0";

    // Use req.user._id from protect middleware
    const ownerId = mine && req.user ? req.user._id : null;

    const ownerFilter = ownerId ? { owner: ownerId } : {};
    const approvedFilter = approvedOnly
      ? { status: /^approved$/i, isPublished: { $ne: false } }
      : {};

    const base = { ...ownerFilter, ...approvedFilter };

    const [total, latestUploads] = await Promise.all([
      Project.countDocuments(base),
      Project.countDocuments({ ...base, createdAt: { $gte: weekAgo } }),
    ]);

    const pendingUploads =
      ownerId
        ? await Project.countDocuments({ owner: ownerId, status: "pending" })
        : 0;

    res.json({ total, latestUploads, pendingUploads });
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

    // Prefer Cloudinary URL
    if (p.fileUrl) {
      return res.redirect(p.fileUrl);
    }

    // Some legacy records might store a direct URL
    if (p.filePath && p.filePath.startsWith("http")) {
      return res.redirect(p.filePath);
    }

    // Legacy local filePath
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
