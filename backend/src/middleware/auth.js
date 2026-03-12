// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import { clearToken } from "../utils/token.js";

/* ========== PROTECT (cookie OR bearer) ========== */
export async function protect(req, res, next) {
  try {
    let token = null;

    // 1) Authorization header: Bearer <token> (case-insensitive)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const [scheme, value] = authHeader.split(" ");
      if (scheme && value && scheme.toLowerCase() === "bearer") {
        token = value;
      }
    }

    // 2) Fallback: cookie jwt
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      clearToken(res);
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      clearToken(res);
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      clearToken(res);
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
    }

    req.user = user;
    return next();
  } catch (e) {
    console.error("protect error:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/* ========== REQUIRE ROLE ========== */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const role = String(req.user.role || "").toLowerCase();
  const allowed = roles.map((r) => String(r).toLowerCase());

  if (!allowed.includes(role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  return next();
};

/* ========== OWNER OR ADMIN ========== */
export const ownerOrAdmin = (paramName = "id") => {
  return async (req, res, next) => {
    const role = String(req.user?.role || "").toLowerCase();
    if (role === "admin") return next();

    const projectId = req.params[paramName];

    const project = await Project.findById(projectId).select("owner");
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own projects.",
      });
    }

    return next();
  };
};