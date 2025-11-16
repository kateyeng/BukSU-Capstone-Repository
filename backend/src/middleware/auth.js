// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";

export async function protect(req, res, next) {
  try {
    const token = req.cookies?.jwt; // ⬅️ must match cookie name
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (e) {
    console.error("protect error:", e);
    return res.status(401).json({ message: "Invalid token" });
  }
}


export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return _res.status(403).json({ message: "Access denied" });
  }
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
