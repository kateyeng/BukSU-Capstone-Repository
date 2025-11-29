// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";

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
