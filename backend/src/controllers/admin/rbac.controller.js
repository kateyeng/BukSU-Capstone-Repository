// backend/src/controllers/admin/rbac.controller.js
import {
  getRbacConfig,
  updateRbacGrants,
  resetRbacToDefault,
} from "../../config/rbac.js";

export async function getRbacSettings(req, res) {
  try {
    return res.json(getRbacConfig());
  } catch (error) {
    console.error("[ADMIN][RBAC][GET][ERROR]", error);
    return res.status(500).json({
      message: "Failed to load RBAC settings",
    });
  }
}

export async function updateRbacSettings(req, res) {
  try {
    const { grants } = req.body || {};

    if (!grants || typeof grants !== "object") {
      return res.status(400).json({
        message: "grants object is required",
      });
    }

    const updated = await updateRbacGrants(grants);

    return res.json({
      message: "RBAC settings updated successfully",
      ...updated,
    });
  } catch (error) {
    console.error("[ADMIN][RBAC][UPDATE][ERROR]", error);
    return res.status(500).json({
      message: "Failed to update RBAC settings",
    });
  }
}

export async function resetRbacSettings(req, res) {
  try {
    const reset = await resetRbacToDefault();

    return res.json({
      message: "RBAC reset to default successfully",
      ...reset,
    });
  } catch (error) {
    console.error("[ADMIN][RBAC][RESET][ERROR]", error);
    return res.status(500).json({
      message: "Failed to reset RBAC settings",
    });
  }
}