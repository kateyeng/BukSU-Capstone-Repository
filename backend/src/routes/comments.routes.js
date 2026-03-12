import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import Comment from "../models/comment.model.js";
import Project from "../models/project.model.js";
import { logActivity } from "../utils/activityLogger.js";

const router = express.Router();

/**
 * All comment routes require authentication
 */
router.use(protect);

/**
 * GET /api/comments?projectId=...
 * Get all comments for a project
 */
router.get("/", async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId required" });
    }

    const comments = await Comment.find({
      project: projectId,
      status: { $ne: "archived" },
    })
      .populate("author", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/comments
 * Create a new comment on a project
 * Body: { projectId, content, page?, section?, replyTo? }
 */
router.post("/", async (req, res, next) => {
  try {
    const { projectId, content, page, section, replyTo } = req.body;

    if (!projectId || !content?.trim()) {
      return res.status(400).json({ message: "projectId and content required" });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only teachers/admins can comment
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only teachers/admins can comment" });
    }

    const comment = await Comment.create({
      project: projectId,
      author: req.user._id,
      authorName: req.user.fullName || req.user.email,
      authorEmail: req.user.email,
      content: content.trim(),
      page: page || null,
      section: section || "",
      replyTo: replyTo || null,
    });

    await comment.populate("author", "fullName email");

    await logActivity(
      req,
      "add_comment",
      {
        projectId: projectId,
        commentId: comment._id.toString(),
      },
      req.user
    );

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/comments/:id
 * Update a comment
 * Body: { content, status? }
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, status } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only author or admin can edit
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed to edit this comment" });
    }

    if (content) comment.content = content.trim();
    if (status && ["active", "resolved", "archived"].includes(status)) {
      comment.status = status;
    }

    await comment.save();
    await comment.populate("author", "fullName email");

    res.json({ comment });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/comments/:id
 * Delete/archive a comment
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only author or admin can delete
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed to delete this comment" });
    }

    await comment.deleteOne();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
