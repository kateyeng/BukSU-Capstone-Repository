// backend/src/routes/admin.rbac.routes.js
import express from "express";
import {
  getRbacSettings,
  updateRbacSettings,
  resetRbacSettings,
} from "../controllers/admin/rbac.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, requireRole("admin"), getRbacSettings);
router.put("/", protect, requireRole("admin"), updateRbacSettings);
router.post("/reset", protect, requireRole("admin"), resetRbacSettings);

export default router;