// routes/auth.routes.js
import express from "express";
import dotenv from "dotenv";
import passport from "passport";

import {
  loginUser,
  registerUser,
  logoutUser,
} from "../controllers/auth/userAuthController.js";

import {
  forgotPasswordUser,
  resetPasswordUser,
  verifyResetCode,
} from "../controllers/auth/passwordController.js";

import { protect } from "../middleware/auth.js";
import User from "../models/user.model.js";

// 🔹 SAME UTILS AS userAuthController (note the ../ instead of ../../)
import { generateToken } from "../utils/token.js";
import { toPublicUser } from "../utils/publicUser.js";

dotenv.config();

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/* =========================================================
   GET /api/auth/me
========================================================= */

router.get("/me", protect, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }

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

  return res.json({ user: safeUser });
});

/* =========================================================
   PATCH /api/auth/me
========================================================= */

router.patch("/me", protect, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    const cleanedName = name.trim();

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: cleanedName,
        fullName: cleanedName,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }

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

router.post("/login", loginUser);
router.post("/logoutUser", logoutUser);
router.post("/register", registerUser);

/* =========================================================
   Password reset routes
========================================================= */

router.post("/forgotPassword", forgotPasswordUser);
router.post("/verifyCode", verifyResetCode);
router.post("/resetPassword", resetPasswordUser);

/* =========================================================
   Google OAuth routes
========================================================= */

// Step 1: start Google OAuth flow
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Step 2: callback from Google
router.get("/google/callback", (req, res, next) => {
  // if client (Postman) sends Accept: application/json, we answer with JSON
  const wantsJson = req.headers.accept?.includes("application/json");

  // 1) Google sent us an error (?error=access_denied, etc.)
  if (req.query.error) {
    const msg = "Google sign-in was cancelled";

    if (wantsJson) {
      return res.status(400).json({ message: msg });
    }

    return res.redirect(
      `${CLIENT_URL}/login?error=${encodeURIComponent(msg)}`
    );
  }

  // 2) Run passport strategy manually so we can handle errors
  passport.authenticate("google", (err, user, info) => {
    if (err || !user) {
      const msg = "Google authentication failed";

      if (wantsJson) {
        return res.status(400).json({ message: msg });
      }

      return res.redirect(
        `${CLIENT_URL}/login?error=${encodeURIComponent(msg)}`
      );
    }

    // 3) Success: set jwt cookie
    generateToken(user, res);

    if (wantsJson) {
      return res.status(200).json({
        message: "Google login successful",
        user: toPublicUser(user),
      });
    }

    return res.redirect(`${CLIENT_URL}/admin`);
  })(req, res, next);
});

export default router;
