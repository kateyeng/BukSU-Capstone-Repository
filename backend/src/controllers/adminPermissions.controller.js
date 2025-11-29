import { getRbacConfig, updateRbacGrants } from "../config/rbac.js";

export function getAdminPermissions(req, res) {
    try {
        const cfg = getRbacConfig();
        return res.json(cfg);
    } catch (err) {
        console.error("getAdminPermissions error:", err);
        return res
            .status(500)
            .json({ message: "Failed to load permissions config" });
    }
}

export async function updateAdminPermissions(req, res) {
    try {
        const { grants } = req.body || {};

        if (!grants || typeof grants !== "object") {
            return res.status(400).json({ message: "Invalid grants payload" });
        }

        const cfg = await updateRbacGrants(grants);

        return res.json({
            message: "Permissions updated successfully",
            ...cfg,
        });
    } catch (err) {
        console.error("updateAdminPermissions error:", err);
        return res.status(500).json({
            message:
                err?.message ||
                "Failed to update permissions (see server logs for details)",
        });
    }
}
