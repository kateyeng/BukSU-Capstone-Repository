// routes/bookmarks.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = Router();

// All bookmark routes: must be logged in AND a teacher
router.use(protect, requireRole("teacher"));

// GET /api/bookmarks  -> my saved projects
router.get("/", async (req, res) => {
  const me = await User.findById(req.user._id)
    .populate({ path: "bookmarks.project", select: "title category year status isPublished createdAt" })
    .lean();

  const list = (me?.bookmarks || [])
    .filter(b => b.project && b.project.status === "approved" && b.project.isPublished !== false)
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .map(b => ({ addedAt: b.addedAt, ...b.project }));

  res.json(list);
});

// POST /api/bookmarks/:projectId -> add bookmark
router.post("/:projectId", async (req, res) => {
  const pid = new mongoose.Types.ObjectId(req.params.projectId);
  const result = await User.updateOne(
    { _id: req.user._id, "bookmarks.project": { $ne: pid } },
    { $push: { bookmarks: { project: pid, addedAt: new Date() } } }
  );
  res.status(result.modifiedCount ? 204 : 200).end();
});

// DELETE /api/bookmarks/:projectId -> remove bookmark
router.delete("/:projectId", async (req, res) => {
  const pid = new mongoose.Types.ObjectId(req.params.projectId);
  await User.updateOne(
    { _id: req.user._id },
    { $pull: { bookmarks: { project: pid } } }
  );
  res.sendStatus(204);
});

export default router;
