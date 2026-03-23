import Project from "../models/project.model.js";
import DeletedProjectBackup from "../models/deletedProjectBackup.model.js";
import DocumentVersion from "../models/documentVersion.model.js";
import Comment from "../models/comment.model.js";
import UserActivity from "../models/userActivity.model.js";
import cloudinary from "../config/cloudinary.js";

import { google } from "googleapis";
import { Readable } from "stream";

import { logActivity } from "../utils/activityLogger.js";

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

/* ========= Google Drive helpers ========= */
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

async function getAdviserUser(adviserId) {
  if (!adviserId) return null;

  try {
    const UserModel = Project.db.model("user");
    const adviserUser = await UserModel.findById(adviserId).select(
      "fullName name email role"
    );

    if (!adviserUser) return null;
    return adviserUser;
  } catch (err) {
    console.error("[ADVISER][LOOKUP][ERROR]", err);
    return null;
  }
}

function isPdfFile(file) {
  if (!file) return false;
  return (
    file.mimetype === "application/pdf" &&
    /\.pdf$/i.test(file.originalname || "")
  );
}

function canAccessProjectHistory(user, project) {
  if (!user || !project) return false;
  if (user.role === "admin") return true;
  if (user.role === "teacher") {
    return !!project.adviser && String(project.adviser) === String(user._id);
  }
  return !!project.owner && String(project.owner) === String(user._id);
}

function buildTimelineEntryFromActivity(activity) {
  const meta = activity?.meta || {};
  const status = String(meta.status || "").toLowerCase();

  if (activity.action === "upload_project") {
    return {
      label: "Submission",
      details: meta.title
        ? `Submitted "${meta.title}" for review`
        : "Document submitted for review",
    };
  }

  if (activity.action === "revise_project") {
    if (status === "approved") {
      return {
        label: "Approval",
        details: meta.reason || "Document approved by reviewer",
      };
    }

    if (status === "rejected") {
      return {
        label: "Rejection",
        details: meta.reason || "Document rejected by reviewer",
      };
    }

    return {
      label: "Revision",
      details:
        meta.reason ||
        meta.title ||
        "Submission updated and sent back for review",
    };
  }

  if (activity.action === "download_pdf") {
    return {
      label: "Download",
      details: meta.title ? `Downloaded "${meta.title}"` : "Document downloaded",
    };
  }

  if (activity.action === "delete_project") {
    return {
      label: "Deletion",
      details: meta.title ? `Deleted "${meta.title}"` : "Document deleted",
    };
  }

  if (activity.action === "restore_project_backup") {
    return {
      label: "Restore",
      details: meta.title ? `Restored "${meta.title}"` : "Document restored",
    };
  }

  return {
    label: activity.action,
    details: meta,
  };
}

async function createDocumentVersionSnapshot(project, user, changeNotes = "") {
  if (!project?._id || !user?._id) return null;

  const latest = await DocumentVersion.findOne({ project: project._id })
    .sort({ versionNumber: -1 })
    .select("versionNumber")
    .lean();

  const versionNumber = Number(latest?.versionNumber || 0) + 1;

  return DocumentVersion.create({
    project: project._id,
    fileUrl: project.fileUrl || null,
    cloudinaryPublicId: project.cloudinaryPublicId || null,
    filePath: project.filePath || null,
    fileSize: project.fileSize || null,
    mimeType: project.mimeType || null,
    versionNumber,
    title: project.title || "",
    abstract: project.abstract || "",
    uploadedBy: user._id,
    uploadedByName: user.fullName || user.name || user.email || "",
    changeNotes,
    statusAtVersion: project.status || "pending",
  });
}

/* ---------- CREATE PROJECT ---------- */
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

    const missing = [];
    if (!title) missing.push("title");
    if (!category) missing.push("category");
    if (!year) missing.push("year");
    if (!abstract) missing.push("abstract");
    if (!authors) missing.push("authors");
    if (!req.file) missing.push("file");

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    if (req.fileValidationError) {
      return res.status(415).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    if (!isPdfFile(req.file)) {
      return res.status(415).json({
        success: false,
        message: "Only PDF files are allowed",
      });
    }

    let authorsArr = [];
    if (Array.isArray(authors)) {
      authorsArr = authors;
    } else if (typeof authors === "string") {
      authorsArr = authors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    let tags = [];
    if (keywords) {
      tags = String(keywords)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    const ownerId = req.user?._id;
    if (!ownerId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const adviserUser = await getAdviserUser(adviser);

    const uploadResult = await uploadPdfBufferToCloudinary(req.file);

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
      adviser: adviserUser?._id || null,
      adviserName:
        adviserUser?.fullName ||
        adviserUser?.name ||
        adviserUser?.email ||
        "",
      department: department || "",
      submitterEmail: req.user?.email || undefined,
      contactEmail: req.user?.email || undefined,
      tags,
      status: status || "pending",
      owner: ownerId,
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      filePath: null,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    await createDocumentVersionSnapshot(project, req.user, "Initial submission");

    await logActivity(
      req,
      "upload_project",
      {
        projectId: String(project._id),
        title: project.title || "",
        category: project.category || "",
        year: project.year || "",
        status: project.status || "",
        fileSize: project.fileSize || 0,
        method: "student_upload",
        adviserId: project.adviser ? String(project.adviser) : null,
        adviserName: project.adviserName || "",
      },
      req.user || null
    );

    return res.status(201).json({
      success: true,
      message: "Project created successfully and pending approval",
      project: {
        id: project._id,
        title: project.title,
        category: project.category,
        year: project.year,
        abstract: project.abstract,
        authors: project.authors,
        adviser: project.adviser || null,
        adviserName: project.adviserName || "",
        keywords: project.tags,
        status: project.status,
        fileUrl: project.fileUrl,
        uploadedBy: {
          id: req.user._id,
          fullName: req.user.fullName || req.user.name || req.user.email,
        },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    console.error("Create project error:", err);
    return res.status(500).json({
      success: false,
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

    if (req.fileValidationError) {
      return res.status(415).json({
        message: req.fileValidationError,
      });
    }

    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    const update = {};
    let changed = false;

    if (title && title !== existingProject.title) {
      update.title = title;
      changed = true;
    }
    if (category && category !== existingProject.category) {
      update.category = category;
      changed = true;
    }
    if (year && Number(year) !== Number(existingProject.year)) {
      update.year = year;
      changed = true;
    }
    if (abstract && abstract !== existingProject.abstract) {
      update.abstract = abstract;
      changed = true;
    }
    if (department && department !== existingProject.department) {
      update.department = department;
      changed = true;
    }
    if (status && status !== existingProject.status) {
      update.status = status;
      changed = true;
    }

    if (authors) {
      const nextAuthors = Array.isArray(authors)
        ? authors
        : String(authors)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

      if (
        JSON.stringify(nextAuthors) !== JSON.stringify(existingProject.authors || [])
      ) {
        update.authors = nextAuthors;
        changed = true;
      }
    }

    if (keywords) {
      const nextTags = String(keywords)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (JSON.stringify(nextTags) !== JSON.stringify(existingProject.tags || [])) {
        update.tags = nextTags;
        changed = true;
      }
    }

    if (typeof adviser !== "undefined") {
      if (!adviser) {
        if (existingProject.adviser || existingProject.adviserName) {
          update.adviser = null;
          update.adviserName = "";
          changed = true;
        }
      } else {
        const adviserUser = await getAdviserUser(adviser);
        const nextAdviser = adviserUser?._id || null;
        const nextAdviserName =
          adviserUser?.fullName ||
          adviserUser?.name ||
          adviserUser?.email ||
          "";

        if (
          String(existingProject.adviser || "") !== String(nextAdviser || "") ||
          String(existingProject.adviserName || "") !== String(nextAdviserName || "")
        ) {
          update.adviser = nextAdviser;
          update.adviserName = nextAdviserName;
          changed = true;
        }
      }
    }

    if (req.file) {
      if (!isPdfFile(req.file)) {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }

      const uploadResult = await uploadPdfBufferToCloudinary(req.file);

      update.fileUrl = uploadResult.secure_url;
      update.cloudinaryPublicId = uploadResult.public_id;
      update.filePath = null;
      update.mimeType = req.file.mimetype;
      update.fileSize = req.file.size;
      changed = true;

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

    const isStudentOwner =
      req.user?.role === "student" &&
      existingProject.owner &&
      String(existingProject.owner) === String(req.user._id);

    if (changed && isStudentOwner) {
      update.status = "pending";
      update.reviewedBy = null;
      update.reviewedByName = "";
    }

    if (!Object.keys(update).length) {
      return res.json(existingProject);
    }

    const project = await Project.findByIdAndUpdate(id, update, { new: true });

    await createDocumentVersionSnapshot(
      project,
      req.user,
      isStudentOwner ? "Student updated submission" : "Project updated"
    );

    await logActivity(
      req,
      "revise_project",
      {
        projectId: String(project._id),
        title: project.title || "",
        status: project.status || "",
      },
      req.user || null
    );

    return res.json(project);
  } catch (err) {
    console.error("Update project error:", err);
    return res.status(500).json({
      message: "Update failed",
      error: err.message || "Unknown error",
    });
  }
};

/* ---------- DELETE PROJECT WITH BACKUP ---------- */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner =
      project.owner && String(project.owner) === String(req.user?._id);
    const isAdmin = req.user?.role === "admin";
    const isTeacher = req.user?.role === "teacher";

    if (!isOwner && !isAdmin && !isTeacher) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await DeletedProjectBackup.create({
      originalProjectId: project._id,
      deletedBy: req.user._id,
      owner: project.owner || null,
      projectData: project.toObject(),
      deletedAt: new Date(),
      isRestored: false,
    });

    await Project.findByIdAndDelete(id);

    await logActivity(
      req,
      "delete_project",
      {
        projectId: String(project._id),
        title: project.title || "",
        category: project.category || "",
        year: project.year || "",
      },
      req.user || null
    );

    return res.json({
      success: true,
      message: "Project deleted successfully. Backup saved.",
    });
  } catch (err) {
    console.error("Delete project error:", err);
    return res.status(500).json({
      message: "Delete failed",
      error: err.message || "Unknown error",
    });
  }
};

/* ---------- LIST MY DELETED PROJECT BACKUPS ---------- */
export const getMyDeletedProjectBackups = async (req, res) => {
  try {
    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const backups = await DeletedProjectBackup.find({
      owner: ownerId,
      isRestored: false,
    })
      .sort({ deletedAt: -1 })
      .lean();

    return res.json({ backups });
  } catch (err) {
    console.error("Get deleted project backups error:", err);
    return res.status(500).json({
      message: "Failed to load deleted backups",
      error: err.message || "Unknown error",
    });
  }
};

/* ---------- RESTORE MY PROJECT FROM BACKUP ---------- */
export const restoreMyDeletedProject = async (req, res) => {
  try {
    const { backupId } = req.params;
    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const backup = await DeletedProjectBackup.findById(backupId);
    if (!backup) {
      return res.status(404).json({ message: "Backup not found" });
    }

    if (String(backup.owner) !== String(ownerId) && req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not allowed to restore this backup" });
    }

    if (backup.isRestored) {
      return res.status(400).json({ message: "This backup was already restored" });
    }

    const data = { ...(backup.projectData || {}) };

    delete data._id;
    delete data.__v;
    delete data.createdAt;
    delete data.updatedAt;

    const restoredProject = await Project.create({
      ...data,
      owner: backup.owner || ownerId,
    });

    await createDocumentVersionSnapshot(
      restoredProject,
      req.user,
      "Restored from deleted backup"
    );

    backup.isRestored = true;
    backup.restoredAt = new Date();
    await backup.save();

    await logActivity(
      req,
      "restore_project_backup",
      {
        backupId: String(backup._id),
        restoredProjectId: String(restoredProject._id),
        title: restoredProject.title || "",
      },
      req.user || null
    );

    return res.json({
      success: true,
      message: "Project restored successfully.",
      project: restoredProject,
    });
  } catch (err) {
    console.error("Restore project backup error:", err);
    return res.status(500).json({
      message: "Restore failed",
      error: err.message || "Unknown error",
    });
  }
};

/* ---------- DOWNLOAD / REDIRECT ---------- */
export const downloadProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id).select(
      "title category year fileUrl filePath"
    );

    if (!project) {
      return res.status(404).json({ message: "Project or file not found" });
    }

    await logActivity(
      req,
      "download_pdf",
      {
        projectId: String(project._id),
        title: project.title || "",
        category: project.category || "",
        year: project.year || "",
        source: project.fileUrl ? "cloudinary" : project.filePath ? "local" : "none",
      },
      req.user || null
    );

    if (project.fileUrl) {
      return res.redirect(project.fileUrl);
    }

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

/* ---------- GET PROJECTS OF LOGGED-IN USER ---------- */
export const getMyProjects = async (req, res) => {
  try {
    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const projects = await Project.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    await logActivity(
      req,
      "view_my_projects",
      {
        count: projects.length,
      },
      req.user
    );

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

/* ---------- PUBLIC PROJECT STATS ---------- */
export const getPublicProjectStats = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const approvedQuery = { status: "approved" };

    const total = await Project.countDocuments(approvedQuery);

    const latestUploads = await Project.countDocuments({
      ...approvedQuery,
      createdAt: { $gte: sevenDaysAgo },
    });

    return res.json({
      total,
      latestUploads,
    });
  } catch (err) {
    console.error("Get public project stats error:", err);
    return res.status(500).json({
      message: "Failed to load public stats",
      error: err.message || "Unknown error",
    });
  }
};

export const getProjectHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id).lean();
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!canAccessProjectHistory(req.user, project)) {
      return res.status(403).json({ message: "Not allowed to view this history" });
    }

    const [versions, comments, activities] = await Promise.all([
      DocumentVersion.find({ project: id })
        .sort({ versionNumber: -1, createdAt: -1 })
        .lean(),
      Comment.find({ project: id, status: { $ne: "archived" } })
        .sort({ createdAt: -1 })
        .select("authorName content status page section createdAt")
        .lean(),
      UserActivity.find({
        $or: [
          { "meta.projectId": String(id) },
          { "meta.thesisId": String(id) },
          { "meta.restoredProjectId": String(id) },
        ],
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const timeline = [
      ...versions.map((version) => ({
        type: "version",
        at: version.createdAt,
        label: `Version ${version.versionNumber}`,
        details: version.changeNotes || "Document version saved",
        data: version,
      })),
      ...comments.map((comment) => ({
        type: "comment",
        at: comment.createdAt,
        label: comment.authorName || "Review comment",
        details: comment.content,
        data: comment,
      })),
      ...activities.map((activity) => {
        const mapped = buildTimelineEntryFromActivity(activity);
        return {
          type: "activity",
          at: activity.createdAt,
          label: mapped.label,
          details: mapped.details,
          data: activity,
        };
      }),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return res.json({
      project,
      versions,
      comments,
      activities,
      timeline,
    });
  } catch (err) {
    console.error("Get project history error:", err);
    return res.status(500).json({
      message: "Failed to load project history",
      error: err.message || "Unknown error",
    });
  }
};

export const getMyActivityHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const action = String(req.query.action || "").trim();

    const filter = {
      user: userId,
      action: {
        $in: [
          "upload_project",
          "revise_project",
          "delete_project",
          "restore_project_backup",
          "download_pdf",
          "view_details",
        ],
      },
    };

    if (action) {
      filter.action = action;
    }

    const activities = await UserActivity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ activities });
  } catch (err) {
    console.error("Get my activity history error:", err);
    return res.status(500).json({
      message: "Failed to load activity history",
      error: err.message || "Unknown error",
    });
  }
};


/* ---------- 2PL LOCKING ---------- */
const LOCK_TTL_MINUTES = 10;

function hasActiveLock(doc) {
  const lock = doc.editLock;
  if (!lock) return false;
  if (lock.expiresAt && lock.expiresAt < new Date()) return false;
  if (lock.releasedAt) return false;
  return true;
}

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

    if (
      hasActiveLock(project) &&
      lock?.lockedBy &&
      lock.lockedBy.toString() !== userId &&
      !isOwner &&
      !isAdmin
    ) {
      return res.status(403).json({ message: "You do not own this lock." });
    }

    project.editLock = undefined;

    await project.save();
    return res.json({ project });
  } catch (err) {
    console.error("[STUDENT][UNLOCK][ERROR]", err);
    return res.status(500).json({ message: "Server error" });
  }
};
