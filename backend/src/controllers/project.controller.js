// backend/src/controllers/project.controller.js
import Project from "../models/project.model.js";
import cloudinary from "../config/cloudinary.js";

import { google } from "googleapis";
import { Readable } from "stream";

/* ========= Cloudinary: upload buffer as RAW PDF ========= */
function uploadPdfBufferToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "buksu-thesis-public",
        public_id: `${Date.now()}-${file.originalname}`,
        type: "upload",
        access_mode: "public",
        access_control: [],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
}

/* ========= Google Drive helpers (backup only) ========= */

// Build a Google OAuth2 client from env vars (using refresh token)
function getDriveAuthClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
    console.warn(
      "[GDRIVE] Missing one of GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET / GOOGLE_DRIVE_REDIRECT_URI / GOOGLE_DRIVE_REFRESH_TOKEN – skipping Drive backup."
    );
    return null;
  }

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  return oAuth2Client;
}

// Upload the PDF buffer to a Drive folder as backup
async function backupPdfToGoogleDrive(file) {
  const auth = getDriveAuthClient();
  if (!auth) return null;

  const drive = google.drive({ version: "v3", auth });

  const folderId =
    process.env.DRIVE_THESIS_FOLDER_ID || process.env.DRIVE_BACKUP_FOLDER_ID;

  if (!folderId) {
    console.warn(
      "[GDRIVE] No DRIVE_THESIS_FOLDER_ID or DRIVE_BACKUP_FOLDER_ID set – skipping Drive backup."
    );
    return null;
  }

  // Turn buffer into a readable stream
  const bufferStream = new Readable();
  bufferStream.push(file.buffer);
  bufferStream.push(null);

  const fileName = `${Date.now()}-${file.originalname}`;

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: file.mimetype,
      parents: [folderId],
    },
    media: {
      mimeType: file.mimetype,
      body: bufferStream,
    },
    fields: "id, name, webViewLink, webContentLink",
  });

  return res.data;
}

/* ---------- CREATE PROJECT (student / teacher / admin via RBAC) ---------- */
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
      return res.status(400).json({
        message:
          "Missing required fields (title, category, year, abstract, authors)",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }

    // authors → array
    let authorsArr = [];
    if (Array.isArray(authors)) {
      authorsArr = authors;
    } else if (typeof authors === "string") {
      authorsArr = authors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // keywords → tags array
    let tags = [];
    if (keywords) {
      tags = String(keywords)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    // owner = logged-in user
    const ownerId = req.user?._id;
    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 1) Upload PDF to Cloudinary (main storage)
    const uploadResult = await uploadPdfBufferToCloudinary(req.file);

    // 2) Fire-and-forget backup to Google Drive
    //    (if this fails, we still keep the Cloudinary upload)
    try {
      const driveMeta = await backupPdfToGoogleDrive(req.file);
      if (driveMeta?.id) {
        console.log(
          "[GDRIVE][BACKUP] OK ->",
          driveMeta.id,
          driveMeta.webViewLink
        );
      }
    } catch (driveErr) {
      console.error(
        "[GDRIVE][BACKUP][ERROR]",
        driveErr?.response?.data || driveErr
      );
    }

    const project = await Project.create({
      title,
      category,
      year,
      abstract,
      authors: authorsArr,
      adviser: adviser || "",
      department: department || "",
      submitterEmail: req.user?.email || undefined,
      contactEmail: req.user?.email || undefined,
      tags,
      status,
      owner: ownerId,

      // Cloudinary file info (primary)
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,

      // legacy local fields (kept for old records)
      filePath: null,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    return res.status(201).json(project);
  } catch (err) {
    console.error("Create project error:", err);
    return res.status(500).json({
      message: "Upload failed",
      error: err.message || "Unknown error",
    });
  }
};

/* ---------- UPDATE PROJECT ---------- */
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

      // 1) Replace file in Cloudinary
      const uploadResult = await uploadPdfBufferToCloudinary(req.file);

      update.fileUrl = uploadResult.secure_url;
      update.cloudinaryPublicId = uploadResult.public_id;
      update.filePath = null;
      update.mimeType = req.file.mimetype;
      update.fileSize = req.file.size;

      // 2) Backup new version to Drive (again, ignore failure)
      try {
        const driveMeta = await backupPdfToGoogleDrive(req.file);
        if (driveMeta?.id) {
          console.log(
            "[GDRIVE][BACKUP][UPDATE] OK ->",
            driveMeta.id,
            driveMeta.webViewLink
          );
        }
      } catch (driveErr) {
        console.error(
          "[GDRIVE][BACKUP][UPDATE][ERROR]",
          driveErr?.response?.data || driveErr
        );
      }
    }

    const project = await Project.findByIdAndUpdate(id, update, { new: true });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch (err) {
    console.error("Update project error:", err);
    return res.status(500).json({
      message: "Update failed",
      error: err.message || "Unknown error",
    });
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
    // optional: delete from Cloudinary using project.cloudinaryPublicId
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    return res.status(500).json({
      message: "Delete failed",
      error: err.message || "Unknown error",
    });
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

    // Prefer Cloudinary URL
    if (project.fileUrl) {
      return res.redirect(project.fileUrl);
    }

    // Fallback: old records using local filePath
    if (project.filePath) {
      return res.redirect(project.filePath);
    }

    return res.status(404).json({ message: "Project or file not found" });
  } catch (err) {
    console.error("Download project error:", err);
    return res.status(500).json({
      message: "Download failed",
      error: err.message || "Unknown error",
    });
  }
};

/* ---------- GET PROJECTS OF LOGGED-IN USER (for profile page) ---------- */
// GET /api/student/projects/mine
export const getMyProjects = async (req, res) => {
  try {
    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const projects = await Project.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(
      "[GET_MY_PROJECTS] user:",
      String(ownerId),
      "count:",
      projects.length
    );

    return res.json({ projects });
  } catch (err) {
    console.error("Get my projects error:", err);
    return res.status(500).json({
      message: "Failed to load your projects",
      error: err.message || "Unknown error",
    });
  }
};

/* ---------- 2PL LOCKING FOR STUDENT / OWNER ---------- */

const LOCK_TTL_MINUTES = 10;

function hasActiveLock(doc) {
  const lock = doc.editLock;
  if (!lock) return false;
  if (lock.expiresAt && lock.expiresAt < new Date()) return false;
  if (lock.releasedAt) return false;
  return true;
}

// POST /api/student/projects/:id/lock
export const lockMyProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner =
      project.owner && project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not allowed to edit this project" });
    }

    const existing = project.editLock;
    if (
      hasActiveLock(project) &&
      existing?.lockedBy &&
      existing.lockedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(423).json({
        message: "This thesis is currently being edited by someone else.",
      });
    }

    const now = new Date();
    const expires = new Date(now.getTime() + LOCK_TTL_MINUTES * 60 * 1000);

    project.editLock = {
      lockedBy: req.user._id,
      lockedByName: req.user.fullName || req.user.name || req.user.email,
      lockedByEmail: req.user.email,
      lockedByRole: req.user.role,
      lockedAt: now,
      expiresAt: expires,
      releasedAt: null,
    };

    await project.save();
    return res.json({ project });
  } catch (err) {
    console.error("[STUDENT][LOCK][ERROR]", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/student/projects/:id/unlock
export const unlockMyProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const lock = project.editLock;
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isOwner = project.owner && project.owner.toString() === userId;

    // only lock owner / owner of thesis / admin can unlock an active lock
    if (
      hasActiveLock(project) &&
      lock?.lockedBy &&
      lock.lockedBy.toString() !== userId &&
      !isOwner &&
      !isAdmin
    ) {
      return res.status(403).json({ message: "You do not own this lock." });
    }

    // ✅ HARD CLEAR THE LOCK so teacher/admin sees it as free
    project.editLock = undefined;

    await project.save();
    return res.json({ project });
  } catch (err) {
    console.error("[STUDENT][UNLOCK][ERROR]", err);
    return res.status(500).json({ message: "Server error" });
  }
};
