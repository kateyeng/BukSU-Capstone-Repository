// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";

<<<<<<< HEAD
export const protect = async (req, res, next) => {
  const token = req.cookies?.jwt;
  if (!token) return res.status(401).json({ message: "Not authorized (no token)" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // MUST match the payload key above: decoded.id
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};


export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return _res.status(403).json({ message: "Access denied" });
  }
=======
export async function protect(req, res, next) {
  try {
    const token = req.cookies?.jwt; // ⬅️ must match cookie name
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (e) {
    console.error("protect error:", e);
    return res.status(401).json({ message: "Invalid token" });
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    console.warn("requireRole: no user on request", {
      path: req.originalUrl,
      method: req.method,
    });
    return res.status(401).json({ message: "Not authenticated" });
  }

  const role = String(req.user.role || "").toLowerCase();
  const allowed = roles.map((r) => String(r).toLowerCase());

  if (!allowed.includes(role)) {
    console.warn("requireRole denied", {
      path: req.originalUrl,
      method: req.method,
      role,
      allowed,
    });
    return res.status(403).json({ message: "Access denied" });
  }

>>>>>>> major-changes
  next();
};

// Optional: teacher can only modify own projects; admin can modify all
export const ownerOrAdmin = (getProjectByParam = "id") => {
  return async (req, res, next) => {
    if (req.user.role === "admin") return next();
    const id = req.params[getProjectByParam];
    const project = await Project.findById(id).select("owner");
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your project" });
    }
    next();
  };
};
