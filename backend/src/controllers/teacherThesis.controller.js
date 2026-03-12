import Thesis from "../models/project.model.js";
import User from "../models/user.model.js";
import {
  sendThesisApprovedEmail,
  sendThesisRejectedEmail,
  sendThesisEditedEmail,
} from "../utils/email.js";
import { logActivity } from "../utils/activityLogger.js";

async function getSubmitterEmail(thesis) {
  if (thesis.submitterEmail) return thesis.submitterEmail;
  if (thesis.owner || thesis.userId) {
    const uid = thesis.owner || thesis.userId;
    const user = await User.findById(uid).lean();
    return user?.email || null;
  }
  return thesis.contactEmail || null;
}

const LOCK_TTL_MINUTES = 10;

function hasActiveLock(doc) {
  const lock = doc.editLock;
  if (!lock) return false;
  if (lock.releasedAt) return false;
  if (!lock.expiresAt) return false;
  if (lock.expiresAt < new Date()) return false;
  return true;
}

// GET /api/teacher/thesis?limit=1000
export async function listTeacherThesis(req, res) {
  try {
    const limit = Number(req.query.limit) || 1000;

    const query = { adviser: req.user._id };

    const docs = await Thesis.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("adviser", "fullName name email")
      .populate("owner", "fullName name email")
      .populate("reviewedBy", "fullName name email");

    const thesis = docs.map((t) => {
      const obj = t.toObject();

      const adviserPop =
        obj.adviser && typeof obj.adviser === "object" ? obj.adviser : null;

      const ownerPop =
        obj.owner && typeof obj.owner === "object" ? obj.owner : null;

      const reviewedByPop =
        obj.reviewedBy && typeof obj.reviewedBy === "object"
          ? obj.reviewedBy
          : null;

      const adviserName =
        adviserPop?.fullName ||
        adviserPop?.name ||
        adviserPop?.email ||
        obj.adviserName ||
        "—";

      const reviewedByName =
        reviewedByPop?.fullName ||
        reviewedByPop?.name ||
        reviewedByPop?.email ||
        obj.reviewedByName ||
        obj.editLock?.lockedByName ||
        "—";

      const submitterName =
        ownerPop?.fullName ||
        ownerPop?.name ||
        ownerPop?.email ||
        "—";

      return {
        ...obj,
        adviserId: adviserPop?._id || obj.adviser || null,
        adviserName,
        reviewedByName,
        submitterName,
      };
    });

    return res.json({ thesis });
  } catch (err) {
    console.error("[TEACHER][LIST][ERROR]", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// PATCH /api/teacher/thesis/:id/status
export async function setThesisStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const thesis = await Thesis.findById(id);
    if (!thesis) return res.status(404).json({ message: "Not found" });

    if (
      thesis.adviser &&
      String(thesis.adviser) !== String(req.user?._id) &&
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You are not allowed to update this thesis.",
      });
    }

    thesis.status = status;

    const reviewerName =
      req.user?.fullName || req.user?.name || req.user?.email || null;

    if (req.user?._id) {
      thesis.reviewedBy = req.user._id;
    }

    if (reviewerName) {
      thesis.reviewedByName = reviewerName;
    }

    if (!thesis.department && req.user?.department) {
      thesis.department = req.user.department;
    }

    await thesis.save();

    await logActivity(
      req,
      "revise_project",
      {
        thesisId: thesis._id.toString(),
        title: thesis.title || "",
        status,
        reason: reason || "",
      },
      req.user
    );

    const to = await getSubmitterEmail(thesis);
    let emailStatus = { sent: false, reason: "skipped" };

    if (!to) {
      console.warn(
        "[MAIL][SKIP] No recipient email for thesis:",
        thesis._id,
        thesis.title
      );
      emailStatus = { sent: false, reason: "no-recipient" };
    } else {
      try {
        if (status === "approved") {
          const r = await sendThesisApprovedEmail({
            to,
            title: thesis.title,
            year: thesis.year,
            category: thesis.category,
          });
          emailStatus = {
            sent: !!r.success,
            messageId: r.messageId || null,
            error: r.error || null,
          };
        } else if (status === "rejected") {
          const r = await sendThesisRejectedEmail({
            to,
            title: thesis.title,
            year: thesis.year,
            category: thesis.category,
            reason,
          });
          emailStatus = {
            sent: !!r.success,
            messageId: r.messageId || null,
            error: r.error || null,
          };
        }

        console.log(
          `[MAIL][${status.toUpperCase()}] to=${to} title="${thesis.title}" ->`,
          emailStatus
        );
      } catch (mailErr) {
        console.error("[MAIL][ERROR]", mailErr);
        emailStatus = {
          sent: false,
          error: mailErr.message || String(mailErr),
        };
      }
    }

    return res.json({ ok: true, thesis, emailStatus });
  } catch (e) {
    console.error("setThesisStatus error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

// PATCH /api/teacher/thesis/:id
export async function editThesis(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const thesis = await Thesis.findById(id);

    if (!thesis) return res.status(404).json({ message: "Not found" });

    if (
      thesis.adviser &&
      String(thesis.adviser) !== String(req.user?._id) &&
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You are not allowed to edit this thesis.",
      });
    }

    const before = thesis.toObject();
    Object.assign(thesis, updates);

    if (req.user?._id) {
      thesis.reviewedBy = req.user._id;
      thesis.reviewedByName =
        req.user.fullName ||
        req.user.name ||
        req.user.email ||
        thesis.reviewedByName;
    }

    await thesis.save();
    const after = thesis.toObject();

    const keys = ["title", "year", "category", "abstract", "keywords", "authors"];
    const changes = {};

    for (const k of keys) {
      if (JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null)) {
        changes[k] = { from: before[k], to: after[k] };
      }
    }

    let emailStatus = { sent: false, reason: "no-changes" };
    const to = await getSubmitterEmail(thesis);

    if (Object.keys(changes).length && to) {
      try {
        const r = await sendThesisEditedEmail({
          to,
          title: thesis.title,
          changes,
        });
        emailStatus = {
          sent: !!r.success,
          messageId: r.messageId || null,
          error: r.error || null,
        };
        console.log('[MAIL][EDIT] to=%s title="%s" ->', to, thesis.title, emailStatus);
      } catch (mailErr) {
        console.error("[MAIL][EDIT][ERROR]", mailErr);
        emailStatus = {
          sent: false,
          error: mailErr.message || String(mailErr),
        };
      }
    } else if (!to) {
      console.warn(
        "[MAIL][EDIT][SKIP] No recipient email for thesis:",
        thesis._id,
        thesis.title
      );
      emailStatus = { sent: false, reason: "no-recipient" };
    }

    if (Object.keys(changes).length) {
      await logActivity(
        req,
        "revise_project",
        {
          thesisId: thesis._id.toString(),
          title: thesis.title || "",
          changes,
        },
        req.user
      );
    }

    return res.json({ ok: true, thesis, emailStatus, changes });
  } catch (e) {
    console.error("editThesis error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/teacher/thesis/:id/lock
export async function lockThesis(req, res) {
  try {
    const { id } = req.params;

    const thesis = await Thesis.findById(id);
    if (!thesis) {
      return res.status(404).json({ message: "Thesis not found" });
    }

    if (
      thesis.adviser &&
      String(thesis.adviser) !== String(req.user?._id) &&
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You are not allowed to lock this thesis.",
      });
    }

    const existing = thesis.editLock;
    const userId = req.user._id.toString();

    if (
      hasActiveLock(thesis) &&
      existing?.lockedBy &&
      existing.lockedBy.toString() !== userId
    ) {
      return res.status(423).json({
        message: "This thesis is currently being edited by someone else.",
      });
    }

    const now = new Date();
    const expires = new Date(now.getTime() + LOCK_TTL_MINUTES * 60 * 1000);

    thesis.editLock = {
      lockedBy: req.user._id,
      lockedByName: req.user.fullName || req.user.name || req.user.email,
      lockedByEmail: req.user.email,
      lockedByRole: req.user.role,
      lockedAt: now,
      expiresAt: expires,
      releasedAt: null,
    };

    await thesis.save();

    return res.json({ thesis });
  } catch (err) {
    console.error("[TEACHER][LOCK][ERROR]", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/teacher/thesis/:id/unlock
export async function unlockThesis(req, res) {
  try {
    const { id } = req.params;

    const thesis = await Thesis.findById(id);
    if (!thesis) {
      return res.status(404).json({ message: "Thesis not found" });
    }

    if (
      thesis.adviser &&
      String(thesis.adviser) !== String(req.user?._id) &&
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You are not allowed to unlock this thesis.",
      });
    }

    const lock = thesis.editLock;
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (
      hasActiveLock(thesis) &&
      lock?.lockedBy &&
      lock.lockedBy.toString() !== userId &&
      !isAdmin
    ) {
      return res.status(403).json({ message: "You do not own this lock." });
    }

    thesis.editLock = {
      ...thesis.editLock,
      releasedAt: new Date(),
      expiresAt: new Date(),
    };

    await thesis.save();

    return res.json({ thesis });
  } catch (err) {
    console.error("[TEACHER][UNLOCK][ERROR]", err);
    return res.status(500).json({ message: "Server error" });
  }
}