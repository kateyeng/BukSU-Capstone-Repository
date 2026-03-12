import fs from "fs";
import path from "path";
import User from "../../models/user.model.js";

export async function uploadAvatar(req, res) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // delete old uploaded avatar file if exists
    if (user.avatar) {
      const oldPath = path.join(process.cwd(), user.avatar.replace(/^\//, ""));
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch {
          // ignore delete failure
        }
      }
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      avatar: user.avatar,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic || "",
        avatar: user.avatar || "",
        isEmailVerified: !!user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("uploadAvatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}