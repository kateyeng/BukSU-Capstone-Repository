import User from "../../models/user.model.js";
import { generateToken } from "../../utils/token.js";
import { logActivity } from "../../utils/activityLogger.js";
import { sendWelcomeEmail } from "../../utils/email.js";

/* =========================================================
   Helper: Determine role from BukSU email domain
========================================================= */
function roleFromEmail(email) {
  const e = String(email || "").toLowerCase().trim();
  if (e.endsWith("@student.buksu.edu.ph")) return "student";
  if (e.endsWith("@teacher.buksu.edu.ph")) return "teacher";
  return "guest";
}

export async function googleCallBack(req, res) {
  try {
    if (!req.user) {
      await logActivity(req, "login_failed", {
        method: "google",
        reason: "oauth_failed",
      });
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }

    // ✅ Google emails are already verified by Google
    // Mark verified + assign role based on domain
    const u = await User.findById(req.user._id);

    if (u) {
      u.isEmailVerified = true;
      u.emailVerificationToken = null;
      
      // ✅ Only assign role from email domain if user is not already an admin/privileged role
      // This preserves manually-assigned admin/teacher/student roles
      if (!u.role || u.role === "guest") {
        u.role = roleFromEmail(u.email);
      }

      await u.save();
      req.user = u;

      // ✅ Optional: send welcome email for NEW google accounts only
      if (req.authInfo?.isNewAccount) {
        try {
          await sendWelcomeEmail(u.email, u.fullName);
        } catch (e) {
          console.error("[Google] welcome email failed:", e?.message || e);
        }
      }
    }

    generateToken(req.user, res);

    await logActivity(
      req,
      "login",
      { method: "google", isNew: !!req.authInfo?.isNewAccount },
      req.user
    );

    const role = (req.user.role || "guest").toLowerCase();
    const target =
      role === "admin"
        ? "/admin"
        : role === "teacher"
        ? "/teacher"
        : role === "student"
        ? "/student"
        : "/";

    return res.redirect(`${process.env.CLIENT_URL}${target}?source=google&role=${role}`);
  } catch (e) {
    await logActivity(req, "login_failed", {
      method: "google",
      reason: "exception",
      error: e.message,
    });
    return res.redirect(`${process.env.CLIENT_URL}/login?error=server`);
  }
}