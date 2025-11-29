<<<<<<< HEAD
=======
// controllers/auth/userAuthController.js
>>>>>>> major-changes
import bcrypt from "bcryptjs";
import User from "../../models/user.model.js";
import { generateToken } from "../../utils/token.js";
import { toPublicUser } from "../../utils/publicUser.js";
import { sendWelcomeEmail } from "../../utils/email.js";
import axios from "axios";
import dotenv from "dotenv";
<<<<<<< HEAD
dotenv.config();

// LOGIN
export async function loginUser(req, res) {
  const { email, password, captcha } = req.body;

  if (!captcha) return res.status(400).json({ message: "Captcha is required" });
=======

dotenv.config();

// ====================== LOGIN ======================
export async function loginUser(req, res) {
  const { email, password, captcha } = req.body;

  if (!captcha) {
    return res.status(400).json({ message: "Captcha is required" });
  }
>>>>>>> major-changes

  const verify = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captcha}`
  );
  if (!verify.data.success) {
    return res.status(400).json({ message: "Captcha verification failed" });
  }

<<<<<<< HEAD
  if (!email || !password) return res.status(400).json({ message: "Invalid credentials" });
=======
  if (!email || !password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
>>>>>>> major-changes

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // If a Google-only account (no local password)
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account does not have a local password. Please sign in with Google or set a password.",
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

<<<<<<< HEAD
    // Set HttpOnly cookie with { id, role }
    generateToken(user, res);

    // Return sanitized user (never expose password)
    return res.status(200).json({
      message: "Successfully Logged in!",
=======
    // ✅ Set HttpOnly cookie with { id, role } (JWT)
    generateToken(user, res);

    // ✅ Return sanitized user (never expose password)
    return res.status(200).json({
      message: "Successfully logged in!",
>>>>>>> major-changes
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error("loginUser error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

<<<<<<< HEAD
// REGISTER
export async function registerUser(req, res) {
  const { fullName, email, password } = req.body;
=======
// ====================== REGISTER ======================
export async function registerUser(req, res) {
  // ⬅️ NOW includes role from body (optional)
  const { fullName, email, password, role } = req.body;
>>>>>>> major-changes

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
<<<<<<< HEAD
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    // NOTE: do NOT allow role from request body here; default is 'student' per your schema
=======
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // 🔐 Allowed roles defined in your schema
    const allowedRoles = ["guest", "student", "teacher", "admin"];
    const requestedRole = typeof role === "string" ? role.toLowerCase() : null;

    // ✅ Decide what role new signups are allowed to have
    // Option A: everyone who signs up is a student
    let userRole = "student";

    // If you want to honour "guest" from frontend you can do:
    if (requestedRole === "guest") {
      userRole = "guest";
    }

    // ⚠️ Typically you do NOT allow "teacher" or "admin" from public signup.
    // Those should be set later by an admin in your admin panel.

>>>>>>> major-changes
    const newUser = await User.create({
      fullName,
      email,
      password: hashed,
<<<<<<< HEAD
    });

    // Set cookie immediately on signup
    generateToken(newUser, res);
    // Optional email
    try { await sendWelcomeEmail(email, fullName); } catch {}

    return res.status(201).json({
      message: "Successfully created an account",
=======
      role: userRole,
    });

    // Set cookie immediately on signup (JWT with id + role)
    generateToken(newUser, res);

    // Optional welcome email
    try {
      await sendWelcomeEmail(email, fullName);
    } catch (_) {
      // don't break signup if email fails
    }

    return res.status(201).json({
      message: "Successfully created an account",
      alert: "Successfully created an account",
>>>>>>> major-changes
      user: toPublicUser(newUser),
    });
  } catch (err) {
    console.error("registerUser error:", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

<<<<<<< HEAD
// LOGOUT
export async function logoutUser(req, res) {
=======
// ====================== LOGOUT ======================
export async function logoutUser(_req, res) {
>>>>>>> major-changes
  res.cookie("jwt", "", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return res.status(200).json({ message: "Logged out successfully" });
}
