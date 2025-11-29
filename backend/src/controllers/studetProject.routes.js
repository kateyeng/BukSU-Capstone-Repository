import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
    createProject,
    updateProject,
    deleteProject,
    downloadProject,
    getMyProjects,
    lockMyProject,
    unlockMyProject,
} from "../controllers/project.controller.js";

const router = express.Router();

router.use(protect, requireRole("student", "teacher", "admin"));

// already existing
router.get("/projects/mine", getMyProjects);
// create / update / delete / download routes here...

// 🔒 NEW: 2PL routes
router.post("/projects/:id/lock", lockMyProject);
router.post("/projects/:id/unlock", unlockMyProject);

export default router;
