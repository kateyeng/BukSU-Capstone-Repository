<<<<<<< HEAD
import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import { loginUser, registerUser, logoutUser } from "../controllers/auth/userAuthController.js";
import { forgotPasswordUser, resetPasswordUser, verifyResetCode, } from '../controllers/auth/passwordController.js';
import { googleCallBack } from '../controllers/auth/googleController.js';
import { protect } from '../middleware/auth.js';
=======
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

import { googleCallBack } from "../controllers/auth/googleController.js";
import { protect } from "../middleware/auth.js";

>>>>>>> major-changes
dotenv.config();

const router = express.Router();

<<<<<<< HEAD
router.get("/me", protect, (req, res) => {
  
  res.json({ user: {
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    role: req.user.role,
    profilePic: req.user.profilePic,
    isEmailVerified: req.user.isEmailVerified,
  }});
});

//Login route connected to controller
router.post('/login', loginUser);

router.post('/logoutUser', logoutUser);

//register route connected to controller 
router.post('/register', registerUser);

// Forgot Password - Send reset code route connected to controller
router.post('/forgotPassword', forgotPasswordUser);

router.post('/verifyCode', verifyResetCode);

// Reset Password - Verify code and update password route connected to controller
router.post('/resetPassword', resetPasswordUser);



// Google OAuth Routes 
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

//Google Call
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
=======
/* =========================================================
   GET /api/auth/me
   - JWT-based only via `protect`
   - This is what your React <App /> calls on load
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
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
    session: true, // we still keep session, but /me uses JWT only
>>>>>>> major-changes
  }),
  googleCallBack
);

<<<<<<< HEAD

=======
>>>>>>> major-changes
export default router;
