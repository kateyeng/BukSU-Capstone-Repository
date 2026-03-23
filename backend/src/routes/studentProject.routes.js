import express from "express";
import {
  createProject,
  updateProject,
  deleteProject,
  downloadProject,
  getMyProjects,
  lockMyProject,
  unlockMyProject,
  getProjectHistory,
  getMyActivityHistory,
  getMyDeletedProjectBackups,
  restoreMyDeletedProject,
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { uploadProjectFile } from "../config/multer.js";

const router = express.Router();

router.get(
  "/projects/mine",
  protect,
  requirePermission("project", "read"),
  getMyProjects
);

router.post(
  "/projects",
  protect,
  requirePermission("project", "create"),
  uploadProjectFile.single("file"),
  createProject
);

router.patch(
  "/projects/:id",
  protect,
  requirePermission("project", "update"),
  uploadProjectFile.single("file"),
  updateProject
);

router.delete(
  "/projects/:id",
  protect,
  requirePermission("project", "delete"),
  deleteProject
);

router.get(
  "/projects/:id/download",
  protect,
  requirePermission("project", "download"),
  downloadProject
);

router.get(
  "/activity",
  protect,
  requirePermission("project", "read"),
  getMyActivityHistory
);

router.get(
  "/projects/:id/history",
  protect,
  requirePermission("project", "read"),
  getProjectHistory
);

router.post(
  "/projects/:id/lock",
  protect,
  requirePermission("project", "update"),
  lockMyProject
);

router.post(
  "/projects/:id/unlock",
  protect,
  requirePermission("project", "update"),
  unlockMyProject
);

router.get(
  "/projects/deleted/backups",
  protect,
  requirePermission("project", "read"),
  getMyDeletedProjectBackups
);

router.post(
  "/projects/deleted/backups/:backupId/restore",
  protect,
  requirePermission("project", "create"),
  restoreMyDeletedProject
);

export default router;
