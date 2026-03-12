// backend/src/routes/backup.routes.js
import express from "express";
import {
    runDbBackup,
    listBackups,
    restoreBackup,
    deleteBackup,
    downloadBackup,
} from "../controllers/backup.controller.js";

import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Only admin can access backup routes
router.use(protect, requireRole("admin"));

router.post("/backup", runDbBackup);               // POST /api/admin/backup
router.get("/backups", listBackups);               // GET /api/admin/backups
router.get("/backups/:id/download", downloadBackup);
router.post("/backups/:id/restore", restoreBackup);
router.delete("/backups/:id", deleteBackup);

// ⭐ THIS IS WHAT YOU FORGOT ⭐
export default router;
