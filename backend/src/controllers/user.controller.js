// backend/src/controllers/user.controller.js
import User from "../models/user.model.js";

/**
 * GET /api/users/teachers
 * Return all users with role "teacher"
 */
export const getTeachers = async (req, res, next) => {
    try {
        const teachers = await User.find({ role: "teacher" }).select(
            "_id fullName email profilePic googleId"
        );

        res.json({ teachers });
    } catch (err) {
        console.error("getTeachers error:", err);
        next(err);
    }
};
