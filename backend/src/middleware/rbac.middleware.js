export const ROLE_PERMISSIONS = {
  student: {
    project: ["create", "read", "update", "delete", "download"],
  },
  teacher: {
    project: ["read", "download"],
  },
  admin: {
    project: ["create", "read", "update", "delete", "download"],
  },
};

export function requirePermission(resource, action) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const role = req.user.role;
      const permissions = ROLE_PERMISSIONS[role] || {};
      const allowedActions = permissions[resource] || [];

      if (!allowedActions.includes(action)) {
        return res.status(403).json({
          message: `Forbidden: ${role} cannot ${action} ${resource}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Permission check failed",
        error: error.message,
      });
    }
  };
}