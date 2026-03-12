// controllers/auth/userAuthController.js
import bcrypt from "bcryptjs";
import axios from "axios";
import crypto from "crypto";
import User from "../../models/user.model.js";
import { generateToken, clearToken } from "../../utils/token.js";
import { toPublicUser } from "../../utils/publicUser.js";
import { sendEmailVerification } from "../../utils/email.js";
import { logActivity } from "../../utils/activityLogger.js";
import { validateStrongPassword } from "../../utils/passwordPolicy.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =========================================================
   Helper: Determine role from BukSU email domain
========================================================= */
function roleFromEmail(email) {
  const e = String(email || "").toLowerCase().trim();
  if (e.endsWith("@student.buksu.edu.ph")) return "student";
  if (e.endsWith("@teacher.buksu.edu.ph")) return "teacher";
  return "guest";
}

/* =========================================================
   Helper: build verify URL
========================================================= */
function buildVerifyUrl(token) {
  const baseUrl =
    process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

/* =========================================================
   VERIFY EMAIL
   GET /api/auth/verify-email?token=xxxx
========================================================= */
export async function verifyEmail(req, res) {
  try {
    const token = String(req.query.token || "").trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // already verified
    if (user.isEmailVerified) {
      user.emailVerificationToken = null;
      await user.save();
      return res.status(200).json({
        success: true,
        message: `Email already verified. Role: ${user.role}`,
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;

    // ✅ Assign role after verification
    user.role = roleFromEmail(user.email);

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Email verified. Role assigned: ${user.role}. You may now login.`,
    });
  } catch (err) {
    console.error("verifyEmail error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/* =========================================================
   LOGIN
========================================================= */
export async function loginUser(req, res) {
  const { email, password, captcha } = req.body;

  try {
    if (!email || !password) {
      clearToken(res);
      await logActivity(req, "login_failed", {
        method: "local",
        reason: "missing_credentials",
        email: email || "",
      });
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (!emailRegex.test(cleanEmail)) {
      clearToken(res);
      await logActivity(req, "login_failed", {
        method: "local",
        reason: "invalid_email_format",
        email: cleanEmail,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Captcha required unless bypass is enabled
    const bypassCaptcha =
      String(process.env.RECAPTCHA_BYPASS || "").toLowerCase() === "true";

    if (!bypassCaptcha) {
      if (!captcha) {
        clearToken(res);
        await logActivity(req, "login_failed", {
          method: "local",
          reason: "captcha_missing",
          email: cleanEmail,
        });
        return res.status(400).json({
          success: false,
          message: "Captcha is required",
        });
      }

      const verify = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captcha}`
      );

      if (!verify.data?.success) {
        clearToken(res);
        await logActivity(req, "login_failed", {
          method: "local",
          reason: "captcha_failed",
          email: cleanEmail,
        });
        return res.status(400).json({
          success: false,
          message: "Captcha verification failed",
        });
      }
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      clearToken(res);
      await logActivity(req, "login_failed", {
        method: "local",
        reason: "user_not_found",
        email: cleanEmail,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.password) {
      clearToken(res);
      await logActivity(req, "login_failed", {
        method: "local",
        reason: "google_only_account",
        email: cleanEmail,
        userId: user._id.toString(),
      });
      return res.status(400).json({
        success: false,
        message:
          "This account uses Google login only. Please sign in with Google.",
      });
    }

    // ✅ Block login if not verified
    if (!user.isEmailVerified) {
      clearToken(res);
      await logActivity(req, "login_failed", {
        method: "local",
        reason: "email_not_verified",
        email: cleanEmail,
        userId: user._id.toString(),
      });
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      clearToken(res);
      await logActivity(req, "login_failed", {
        method: "local",
        reason: "wrong_password",
        email: cleanEmail,
        userId: user._id.toString(),
      });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user, res);

    await logActivity(req, "login", { method: "local" }, user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error("loginUser error:", err);
    clearToken(res);
    await logActivity(req, "login_failed", {
      method: "local",
      reason: "server_error",
      email: email || "",
    });
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/* =========================================================
   REGISTER
========================================================= */
export async function registerUser(req, res) {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const passwordCheck = validateStrongPassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ Create verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await User.create({
      fullName,
      email: cleanEmail,
      password: hashed,
      role: "guest", // always guest until verified
      isEmailVerified: false,
      emailVerificationToken,
    });

    // Send verification link
    try {
      const verifyUrl = buildVerifyUrl(emailVerificationToken);
      await sendEmailVerification(cleanEmail, fullName, verifyUrl);
    } catch (e) {
      console.error("sendEmailVerification error:", e);
    }

    await logActivity(req, "register", { method: "local" }, newUser);

    return res.status(201).json({
      success: true,
      message: "Account created. Please verify your email.",
      user: {
        id: newUser._id.toString(),
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("registerUser error:", err);

    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/* =========================================================
   LOGOUT
========================================================= */
export async function logoutUser(req, res) {
  clearToken(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}