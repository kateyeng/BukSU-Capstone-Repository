// backend/src/controllers/adminUserController.js
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/* ========== helpers ========== */
function isLockActive(user) {
    const expiresAt = user?.editLock?.expiresAt;
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() > Date.now();
}

function toAdminUserDTO(user) {
    const lockActive = isLockActive(user);
    return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        editLock: lockActive
            ? {
                lockedBy: user.editLock.lockedBy,
                expiresAt: user.editLock.expiresAt,
            }
            : null,
    };
}

/* =========================================================
   GET /api/admin/users
========================================================= */
export async function getAdminUsers(req, res) {
    try {
        const users = await User.find({})
            .select("fullName email role createdAt editLock")
            .sort({ createdAt: -1 });

        res.json({ users: users.map(toAdminUserDTO) });
    } catch (err) {
        console.error("getAdminUsers error:", err);
        res.status(500).json({ message: "Failed to load users" });
    }
}

/* =========================================================
   PATCH /api/admin/users/:id
   Body: { fullName, email }
========================================================= */
export async function updateUserBasic(req, res) {
    try {
        const { id } = req.params;
        const { fullName, email } = req.body;

        if (!fullName || !email) {
            return res
                .status(400)
                .json({ message: "fullName and email are required." });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.fullName = fullName;
        user.email = email;

        await user.save();

        res.json({
            message: "User updated successfully",
            user: toAdminUserDTO(user),
        });
    } catch (err) {
        console.error("updateUserBasic error:", err);

        if (err.code === 11000 && err.keyPattern?.email) {
            return res.status(400).json({ message: "Email is already in use." });
        }

        res.status(500).json({ message: "Failed to update user" });
    }
}

/* =========================================================
   PATCH /api/admin/users/:id/role
   Body: { role: "student" | "teacher" | "admin" }
========================================================= */
export async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const allowedRoles = ["student", "teacher", "admin"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.role = role;
        await user.save();

        res.json({
            message: "User role updated successfully",
            user: toAdminUserDTO(user),
        });
    } catch (err) {
        console.error("updateUserRole error:", err);
        res.status(500).json({ message: "Failed to update user role" });
    }
}

/* =========================================================
   DELETE /api/admin/users/:id
========================================================= */
export async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        // optional safety: prevent deleting your own admin account
        if (String(req.user._id) === String(id)) {
            return res
                .status(400)
                .json({ message: "You cannot delete your own account." });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("deleteUser error:", err);
        res.status(500).json({ message: "Failed to delete user" });
    }
}

/* =========================================================
   POST /api/admin/users/:id/lock
========================================================= */
export async function lockUserEditing(req, res) {
    try {
        const { id } = req.params;
        const adminId = req.user?._id;

        if (!adminId) return res.status(401).json({ message: "Unauthorized" });
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (
            user.editLock?.lockedBy &&
            isLockActive(user) &&
            user.editLock.lockedBy.toString() !== adminId.toString()
        ) {
            return res.status(423).json({
                message: "This user is currently being edited by another admin.",
                lockedBy: user.editLock.lockedBy,
                expiresAt: user.editLock.expiresAt,
            });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);
        user.editLock = { lockedBy: adminId, lockedAt: now, expiresAt };
        await user.save();

        res.json({ message: "Lock acquired", expiresAt });
    } catch (err) {
        console.error("lockUserEditing error:", err);
        res.status(500).json({ message: "Failed to acquire lock" });
    }
}

/* =========================================================
   POST /api/admin/users/:id/unlock
========================================================= */
export async function unlockUserEditing(req, res) {
    try {
        const { id } = req.params;
        const adminId = req.user?._id;

        if (!adminId) return res.status(401).json({ message: "Unauthorized" });
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (
            user.editLock?.lockedBy &&
            user.editLock.lockedBy.toString() !== adminId.toString() &&
            isLockActive(user)
        ) {
            return res
                .status(403)
                .json({ message: "You do not own this lock." });
        }

        user.editLock = { lockedBy: null, lockedAt: null, expiresAt: null };
        await user.save();

        res.json({ message: "Lock released" });
    } catch (err) {
        console.error("unlockUserEditing error:", err);
        res.status(500).json({ message: "Failed to release lock" });
    }
}

/* =========================================================
   GET /api/admin/metrics
========================================================= */
export async function getAdminMetrics(req, res) {
    try {
        const [
            projects,
            users,
            viewsAgg,
            pending,
            approved,
            rejected,
            usersByRoleAgg,
        ] = await Promise.all([
            Project.countDocuments(),
            User.countDocuments(),
            Project.aggregate([{ $group: { _id: null, views: { $sum: "$views" } } }]),
            Project.countDocuments({ status: "pending" }),
            Project.countDocuments({ status: "approved" }),
            Project.countDocuments({ status: "rejected" }),
            User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        ]);

        const totalViews = viewsAgg[0]?.views ?? 0;

        const usersByRole = { guest: 0, student: 0, teacher: 0, admin: 0 };
        usersByRoleAgg.forEach((r) => {
            usersByRole[r._id] = r.count;
        });

        res.json({
            projects,
            users,
            totalViews,
            pending,
            approved,
            rejected,
            usersByRole,
        });
    } catch (err) {
        console.error("getAdminMetrics error:", err);
        res.status(500).json({ message: "Failed to load metrics" });
    }
}
