// backend/src/routes/studentProjects.js
import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
    uploadProject,
    getMyProjects,
    deleteMyProject,
    lockMyProject,
    unlockMyProject,
    downloadMyProject,
} from "../controllers/student/projectController.js"; // make sure these exist

const router = express.Router();

/**
 * All student project routes:
 * base path in server: app.use("/api/student", studentProjectsRouter);
 *
 * Frontend calls:
 *  - POST   /api/student/projects               (upload)
 *  - GET    /api/student/projects/mine          (list my projects)
 *  - DELETE /api/student/projects/:id           (delete my project)
 *  - POST   /api/student/projects/:id/lock      (2PL lock)
 *  - POST   /api/student/projects/:id/unlock    (2PL unlock)
 *  - GET    /api/student/projects/:id/download  (download my PDF)
 */

// all require login as student
router.use(protect, requireRole("student"));

/* UPLOAD A NEW PROJECT */
router.post("/projects", uploadProject);

/* GET ALL PROJECTS OF LOGGED-IN STUDENT */
router.get("/projects/mine", getMyProjects);

/* DELETE MY OWN PROJECT */
router.delete("/projects/:id", deleteMyProject);

/* 2PL: LOCK FOR EDITING */
router.post("/projects/:id/lock", lockMyProject);

/* 2PL: UNLOCK AFTER EDIT */
router.post("/projects/:id/unlock", unlockMyProject);

/* DOWNLOAD MY PROJECT PDF */
router.get("/projects/:id/download", downloadMyProject);

export default router;
