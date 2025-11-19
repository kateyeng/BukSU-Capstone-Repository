// routes/teacher.routes.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import Project from "../models/project.model.js";
import {
  setThesisStatus,
  editThesis,
} from "../controllers/teacherThesis.controller.js";

const router = express.Router();

// all teacher routes require login with role "teacher"
router.use(protect, requireRole("teacher"));

/* ========== THESIS LIST (default: pending+approved) ========== */
router.get("/thesis", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const status = req.query.status; // optional ?status=pending

    const filter = {};
    if (status) filter.status = status;

    const thesis = await Project.find(
      filter,
      "title category year authors status createdAt submitterEmail owner"
    )
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ thesis });
  } catch (err) {
    next(err);
  }
});

/* ========== STATUS UPDATE (APPROVE / REJECT / PENDING) ========== */
// PATCH /api/teacher/thesis/:id/status
router.patch("/thesis/:id/status", setThesisStatus);

/* ========== EDIT THESIS ========== */
// PATCH /api/teacher/thesis/:id
router.patch("/thesis/:id", editThesis);

/* ========== DELETE THESIS (optional) ========== */
router.delete("/thesis/:id", async (req, res, next) => {
  try {
    const doc = await Project.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

// TEMP: quick check router is mounted
router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "teacher router is mounted" });
});

export default router;
