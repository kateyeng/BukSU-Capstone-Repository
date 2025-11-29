<<<<<<< HEAD
import User from "../../models/user.model.js";
import { generateToken } from '../../utils/token.js';



export async function googleCallBack (req, res) {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      }

      // Generate JWT token for the authenticated user
      const token = generateToken(req.user._id, res);

      // Return user data and redirect to frontend
      const userData = {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        profilePic: req.user.profilePic,
        role: req.user.role,
      };

      // Redirect to frontend with success
      res.redirect(
        `${process.env.CLIENT_URL}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`
      );
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
}


=======
// controllers/auth/googleController.js
import User from "../../models/user.model.js";
import { generateToken } from "../../utils/token.js";
import { sendWelcomeEmail } from "../../utils/email.js";

export async function googleCallBack(req, res) {
  try {
    if (!req.user) {
      console.error("googleCallBack: req.user missing");
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=oauth_failed`
      );
    }

    // Optional: welcome email only on brand-new Google signup
    if (req.authInfo?.isNewAccount && !req.user.welcomeEmailSentAt) {
      try {
        const result = await sendWelcomeEmail(
          req.user.email,
          req.user.fullName
        );
        if (result?.success) {
          console.log("[WelcomeEmail] sent:", result.messageId);
          req.user.welcomeEmailSentAt = new Date();
          await req.user.save();
        } else {
          console.error("[WelcomeEmail] failed:", result?.error);
        }
      } catch (e) {
        console.error("[WelcomeEmail] exception:", e);
      }
    }

    // ✅ Issue auth cookie/JWT (same as local login)
    generateToken(req.user, res);

    const role = (req.user.role || "guest").toLowerCase();

    // SPA target paths
    const roleToPath = {
      admin: "/admin",
      teacher: "/teacher",
      student: "/student",
      guest: "/", // guests go to public landing page
    };
    const targetPath = roleToPath[role] || "/";

    const url = new URL(`${process.env.CLIENT_URL}${targetPath}`);
    url.searchParams.set("source", "google");
    url.searchParams.set("role", role);
    url.searchParams.set("isNew", String(!!req.authInfo?.isNewAccount));

    // Guests (pending) should show verify message
    if (role === "guest") {
      url.searchParams.set("notice", "verify");
    } else {
      url.searchParams.set("notice", "ok");
    }

    console.log("[GoogleCB] redirect ->", url.toString());
    return res.redirect(url.toString());
  } catch (e) {
    console.error("googleCallBack error:", e);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=server`);
  }
}

>>>>>>> major-changes
export default User;