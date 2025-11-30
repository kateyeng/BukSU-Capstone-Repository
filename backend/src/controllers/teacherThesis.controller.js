// backend/src/controllers/teacherThesis.controller.js
import Thesis from "../models/project.model.js";
import User from "../models/user.model.js";
import {
  sendThesisApprovedEmail,
  sendThesisRejectedEmail,
  sendThesisEditedEmail,
} from "../utils/email.js";

async function getSubmitterEmail(thesis) {
  if (thesis.submitterEmail) return thesis.submitterEmail;
  if (thesis.owner || thesis.userId) {
    const uid = thesis.owner || thesis.userId;
    const user = await User.findById(uid).lean();
    return user?.email || null;
  }
  return thesis.contactEmail || null;
}

/* ========= 2PL helpers ========= */

const LOCK_TTL_MINUTES = 10; // how long a lock is valid

function hasActiveLock(doc) {
  const lock = doc.editLock;
  if (!lock) return false;
  if (lock.releasedAt) return false;

  // ignore old “legacy” locks that have no expiresAt
  if (!lock.expiresAt) return false;

  if (lock.expiresAt && lock.expiresAt < new Date()) return false;
  return true;
}

/* ========= LIST FOR TEACHER ACTIVITY ========= */

// GET /api/teacher/thesis?limit=1000
export async function listTeacherThesis(req, res) {
  try {
    const limit = Number(req.query.limit) || 1000;

    // if you only want this teacher's theses, uncomment:
    // const filter = { adviser: req.user._id };
    const filter = {};

    const docs = await Thesis.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("adviser", "fullName name email");

    const thesis = docs.map((t) => {
      const obj = t.toObject();

      const adviserPop =
        t.adviser && typeof t.adviser === "object" && t.adviser !== null
          ? t.adviser
          : null;

      const adviserName =
        obj.adviserName || // may already be saved on the thesis
        adviserPop?.fullName ||
        adviserPop?.name ||
        adviserPop?.email ||
        "";

      return {
        ...obj,
        adviserId: adviserPop?._id || obj.adviser || null,
        adviserName,
      };
    });

    return res.json({ thesis });
  } catch (err) {
    console.error("[TEACHER][LIST][ERROR]", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ========= STATUS (approve / reject / pending) ========= */

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

    thesis.status = status;

    // ---- record who reviewed this thesis ----
    if (req.user?._id) {
      thesis.adviser = req.user._id; // ObjectId ref to user
    }
    const reviewerName =
      req.user?.name || req.user?.fullName || req.user?.email || null;
    if (reviewerName) {
      thesis.adviserName = reviewerName;
    }
    if (!thesis.department && req.user?.department) {
      thesis.department = req.user.department;
    }
    // -----------------------------------------

    await thesis.save();

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

/* ========= TEACHER EDIT ========= */

// PATCH /api/teacher/thesis/:id  (teacher edit)
export async function editThesis(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const thesis = await Thesis.findById(id);
    if (!thesis) return res.status(404).json({ message: "Not found" });

    const before = thesis.toObject();
    Object.assign(thesis, updates);
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
        console.log(
          '[MAIL][EDIT] to=%s title="%s" ->',
          to,
          thesis.title,
          emailStatus
        );
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

    return res.json({ ok: true, thesis, emailStatus, changes });
  } catch (e) {
    console.error("editThesis error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ========= 2PL: LOCK / UNLOCK ========= */

// POST /api/teacher/thesis/:id/lock
export async function lockThesis(req, res) {
  try {
    const { id } = req.params;

    const thesis = await Thesis.findById(id);
    if (!thesis) {
      return res.status(404).json({ message: "Thesis not found" });
    }

    const existing = thesis.editLock;
    const userId = req.user._id.toString();

    // someone else already holds an active lock
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
      lockedByName: req.user.name || req.user.fullName || req.user.email,
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

    const lock = thesis.editLock;
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    // only owner of the lock OR admin can unlock
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
