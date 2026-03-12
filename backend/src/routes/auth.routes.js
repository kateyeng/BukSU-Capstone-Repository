// routes/auth.routes.js
import express from "express";
import passport from "passport";

import {
  loginUser,
  registerUser,
  logoutUser,
  verifyEmail,
} from "../controllers/auth/userAuthController.js";

import {
  forgotPasswordUser,
  resetPasswordUser,
  verifyResetCode,
} from "../controllers/auth/passwordController.js";

import { protect } from "../middleware/auth.js";
import User from "../models/user.model.js";
import { googleCallBack } from "../controllers/auth/googleController.js";

import { uploadAvatar } from "../controllers/auth/profileController.js";
import { avatarUpload } from "../config/avatarUpload.js";

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/* =========================================================
   GET /api/auth/me
========================================================= */
router.get("/me", protect, (req, res) => {
  // ✅ prevent 304 caching for auth state
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  if (!req.user) return res.status(401).json({ user: null });

  const src =
    typeof req.user.toObject === "function" ? req.user.toObject() : req.user;

  const {
    password,
    resetPasswordToken,
    resetPasswordExpires,
    resetCode,
    emailVerificationToken,
    ...safeUser
  } = src;

  return res.status(200).json({ user: safeUser });
});

/* =========================================================
   PATCH /api/auth/me
========================================================= */
router.patch("/me", protect, async (req, res, next) => {
  try {
    const { fullName } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ message: "fullName is required." });
    }

    const cleanedName = String(fullName).trim();

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { fullName: cleanedName },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "User not found." });

    const src =
      typeof updated.toObject === "function" ? updated.toObject() : updated;

    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      resetCode,
      emailVerificationToken,
      ...safeUser
    } = src;

    return res.json({ user: safeUser });
  } catch (err) {
    console.error("[AUTH][PATCH /me] ERROR", err);
    next(err);
  }
});

/* =========================================================
   Local auth routes
========================================================= */

// ✅ IMPORTANT: make sure your frontend uses these exact paths:
router.post("/registerUser", registerUser);
router.post("/loginUser", loginUser);

// Protected logout (uses req.user logging etc.)
router.post("/logoutUser", protect, logoutUser);

// Optional: public logout that just clears cookie even if token missing
router.post("/logout", logoutUser);

// Email verification link
router.get("/verify-email", verifyEmail);

/* =========================================================
   Password reset routes
========================================================= */
router.post("/forgotPassword", forgotPasswordUser);
router.post("/verifyCode", verifyResetCode);
router.post("/resetPassword", resetPasswordUser);

/* =========================================================
   Google OAuth routes
========================================================= */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=oauth_failed`,
  }),
  googleCallBack
);

router.post(
  "/upload-avatar",
  protect,
  avatarUpload.single("avatar"),
  uploadAvatar
);

export default router;