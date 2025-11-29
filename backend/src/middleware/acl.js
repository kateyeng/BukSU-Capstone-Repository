// backend/src/middleware/acl.js
import { canRole } from "../config/rbac.js";

export function requirePermission(resource, action) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const role = req.user.role || "guest";

            // Admin shortcut (optional)
            if (role === "admin") {
                return next();
            }

            const allowed = await canRole(role, resource, action);
            if (!allowed) {
                return res.status(403).json({ message: "Forbidden for your role" });
            }

            next();
        } catch (err) {
            console.error("requirePermission error:", err);
            res.status(500).json({ message: err.message || "Permission check failed" });
        }
    };
}
