import express from "express";
import {
    runDbBackup,
    listBackups,
    downloadBackup,
    restoreBackup,
    deleteBackup
} from "../controllers/backup.controller.js";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

// Admin-only
router.use(protect, requireRole("admin"));

router.post("/backup", runDbBackup);
router.get("/backups", listBackups);
router.get("/backups/:id/download", downloadBackup);
router.post("/backups/:id/restore", restoreBackup);
router.delete("/backups/:id", deleteBackup);

export default router;
