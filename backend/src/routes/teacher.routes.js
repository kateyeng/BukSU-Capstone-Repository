import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { requirePermission } from "../middleware/acl.js";
import Project from "../models/project.model.js";
import { logActivity } from "../utils/activityLogger.js";
import { getProjectHistory } from "../controllers/project.controller.js";
import {
  setThesisStatus,
  editThesis,
  lockThesis,
  unlockThesis,
} from "../controllers/teacherThesis.controller.js";

const router = express.Router();

router.use(protect, requireRole("teacher", "admin"));

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

      const thesis = await Project.find(filter)
        .select(`
          title
          category
          year
          authors
          status
          createdAt
          updatedAt
          submitterEmail
          owner
          adviser
          adviserName
          reviewedBy
          reviewedByName
          department
          editLock
          fileUrl
          filePath
        `)
        .populate("owner", "fullName name email")
        .populate("adviser", "fullName name email")
        .populate("reviewedBy", "fullName name email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      res.json({ thesis });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/thesis/:id/history",
  requirePermission("thesis", "view"),
  getProjectHistory
);

router.patch(
  "/thesis/:id/status",
  requirePermission("thesis", "approve"),
  setThesisStatus
);

router.patch(
  "/thesis/:id",
  requirePermission("thesis", "edit"),
  editThesis
);

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

router.delete("/thesis/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = { _id: id };

    if (req.user.role === "teacher") {
      filter.adviser = req.user._id;
    }

    const doc = await Project.findOne(filter);

    if (!doc) {
      return res
        .status(404)
        .json({ message: "Thesis not found or not allowed to delete." });
    }

    await doc.deleteOne();

    await logActivity(
      req,
      "delete_project",
      {
        projectId: doc._id.toString(),
        thesisId: doc._id.toString(),
        title: doc.title || "",
      },
      req.user
    );

    return res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

router.get("/analytics", async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "teacher") {
      filter.adviser = req.user._id;
    }

    const total = await Project.countDocuments(filter);

    const byStatus = await Project.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const recent = await Project.find(filter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title status updatedAt")
      .lean();

    const statusMap = {};
    byStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    res.json({
      total,
      pending: statusMap.pending || 0,
      approved: statusMap.approved || 0,
      rejected: statusMap.rejected || 0,
      recent,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/thesis/bulk/approve", async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array required" });
    }

    const filter = { _id: { $in: ids }, status: "pending" };
    if (req.user.role === "teacher") {
      filter.adviser = req.user._id;
    }

    const result = await Project.updateMany(filter, {
      $set: {
        status: "approved",
        reviewedBy: req.user._id,
        reviewedByName: req.user.fullName || req.user.email,
      },
    });

    await logActivity(
      req,
      "bulk_approve_projects",
      {
        count: result.modifiedCount,
      },
      req.user
    );

    res.json({
      message: `Approved ${result.modifiedCount} thesis/theses`,
      count: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/thesis/bulk/reject", async (req, res, next) => {
  try {
    const { ids, reason } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array required" });
    }

    const filter = { _id: { $in: ids }, status: "pending" };
    if (req.user.role === "teacher") {
      filter.adviser = req.user._id;
    }

    const result = await Project.updateMany(filter, {
      $set: {
        status: "rejected",
        reviewedBy: req.user._id,
        reviewedByName: req.user.fullName || req.user.email,
      },
    });

    await logActivity(
      req,
      "bulk_reject_projects",
      {
        count: result.modifiedCount,
        reason: reason || "",
      },
      req.user
    );

    res.json({
      message: `Rejected ${result.modifiedCount} thesis/theses`,
      count: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "teacher router is mounted" });
});

export default router;
