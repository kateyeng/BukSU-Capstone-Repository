// backend/src/controllers/project.controller.js
import Project from "../models/project.model.js";
import cloudinary from "../config/cloudinary.js";

/* Helper: upload buffer to Cloudinary as RAW (PDF) */
function uploadPdfBufferToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "buksu-thesis-public",
        public_id: `${Date.now()}-${file.originalname}`,
        type: "upload",
        access_mode: "public",
        access_control: [],  // no “blocked for delivery” rules
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
}

/* ---------- CREATE PROJECT (teacher/admin) ---------- */
export const createProject = async (req, res) => {
  try {
    const {
      title,
      category,
      year,
      abstract,
      authors,
      adviser,
      department,
      keywords,
      status = "pending",
    } = req.body;

    if (!title || !category || !year || !abstract || !authors) {
      return res
        .status(400)
        .json({ message: "Missing required fields (title, category, year, abstract, authors)" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }

    // Convert authors string → array
    let authorsArr = [];
    if (Array.isArray(authors)) {
      authorsArr = authors;
    } else if (typeof authors === "string") {
      authorsArr = authors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Keywords → tags array
    let tags = [];
    if (keywords) {
      tags = String(keywords)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    // Upload PDF buffer to Cloudinary
    const uploadResult = await uploadPdfBufferToCloudinary(req.file);

    // Owner from session or body, if present
    const ownerId = req.user?._id || req.body.owner || null;

    const project = await Project.create({
      title,
      category,
      year,
      abstract,
      authors: authorsArr,
      adviser: adviser || "",
      // department,
      tags,
      status,
      owner: ownerId,

      // ✅ Cloudinary fields
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,

      // optional legacy local path (not used now)
      filePath: null,

      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });


    return res.status(201).json(project);
  } catch (err) {
    console.error("Create project error:", err);
    return res
      .status(500)
      .json({ message: "Upload failed", error: err.message || "Unknown error" });
  }
};

/* ---------- UPDATE PROJECT (simple metadata update + optional new file) ---------- */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      year,
      abstract,
      authors,
      adviser,
      department,
      keywords,
      status,
    } = req.body;

    const update = {};

    if (title) update.title = title;
    if (category) update.category = category;
    if (year) update.year = year;
    if (abstract) update.abstract = abstract;
    if (adviser) update.adviser = adviser;
    if (department) update.department = department;
    if (status) update.status = status;

    if (authors) {
      if (Array.isArray(authors)) {
        update.authors = authors;
      } else {
        update.authors = String(authors)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (keywords) {
      update.tags = String(keywords)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    // Optional new file
    if (req.file) {
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }
      const uploadResult = await uploadPdfBufferToCloudinary(req.file);

      // ✅ Cloudinary fields
      update.fileUrl = uploadResult.secure_url;
      update.cloudinaryPublicId = uploadResult.public_id;

      // optional: clear legacy filePath
      update.filePath = null;

      update.mimeType = req.file.mimetype;
      update.fileSize = req.file.size;
    }


    const project = await Project.findByIdAndUpdate(id, update, { new: true });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch (err) {
    console.error("Update project error:", err);
    return res
      .status(500)
      .json({ message: "Update failed", error: err.message || "Unknown error" });
  }
};

/* ---------- DELETE PROJECT ---------- */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    // (Optional) you could also delete from Cloudinary using the public_id
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    return res
      .status(500)
      .json({ message: "Delete failed", error: err.message || "Unknown error" });
  }
};

/* ---------- DOWNLOAD / REDIRECT ---------- */
export const downloadProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
  return res.status(404).json({ message: "Project or file not found" });
    }

    // ✅ Prefer Cloudinary URL
    if (project.fileUrl) {
      return res.redirect(project.fileUrl);
    }

    // Fallback for very old records that still use filePath
    if (project.filePath) {
      return res.redirect(project.filePath);
    }

    return res.status(404).json({ message: "Project or file not found" });

  } catch (err) {
    console.error("Download project error:", err);
    return res
      .status(500)
      .json({ message: "Download failed", error: err.message || "Unknown error" });
  }
};
