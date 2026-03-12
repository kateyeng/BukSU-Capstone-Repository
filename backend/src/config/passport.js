// backend/src/config/passport.js
import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

/* =========================================================
   Helper: Determine role from BukSU email domain
========================================================= */
function roleFromEmail(email) {
  const e = String(email || "").toLowerCase().trim();
  if (e.endsWith("@student.buksu.edu.ph")) return "student";
  if (e.endsWith("@teacher.buksu.edu.ph")) return "teacher";
  return "guest";
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase()?.trim() || null;
        if (!email) {
          return done(null, false, { message: "Google account has no email" });
        }

        // ✅ Always verified because Google verified it
        const updatesFromGoogle = {
          googleId: profile.id,
          profilePic: profile.photos?.[0]?.value || "",
          isEmailVerified: true,
          emailVerificationToken: null,
          provider: "google",
        };

        // 1) Known googleId → returning user
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          // Optional: refresh pic / ensure verified
          user.profilePic = user.profilePic || updatesFromGoogle.profilePic;
          user.isEmailVerified = true;
          user.emailVerificationToken = null;

          // ✅ Only recompute role from email if role is missing (not set)
          // This preserves manually-assigned admin/teacher/student roles
          console.log("[Google Strategy] User found. Current role:", user.role, "Email:", user.email);
          if (!user.role) {
            console.log("[Google Strategy] Role was empty, setting to:", roleFromEmail(user.email));
            user.role = roleFromEmail(user.email);
          } else {
            console.log("[Google Strategy] Preserving role:", user.role);
          }

          await user.save();

          console.log("[Google] returning user:", user.email, "role:", user.role);
          return done(null, user, { isNewAccount: false });
        }

        // 2) Existing local account with same email → link (not new)
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          user.profilePic = user.profilePic || updatesFromGoogle.profilePic;
          user.isEmailVerified = true;
          user.emailVerificationToken = null;
          user.provider = "google";

          // ✅ Only recompute role from email if role is missing (not set)
          // This preserves manually-assigned admin/teacher/student roles
          if (!user.role) {
            user.role = roleFromEmail(user.email);
          }

          await user.save();

          console.log("[Google] linked google to existing:", user.email, "role:", user.role);
          return done(null, user, { isNewAccount: false, linkedGoogle: true });
        }

        // 3) First-time Google login → create user
        const newUser = await User.create({
          fullName: profile.displayName || "New User",
          email,
          googleId: profile.id,
          profilePic: updatesFromGoogle.profilePic,
          role: roleFromEmail(email), // ✅ student/teacher/guest
          isEmailVerified: true,
          emailVerificationToken: null,
          provider: "google",
          welcomeEmailSentAt: null,
        });

        console.log("[Google] created new user:", newUser.email, "role:", newUser.role);
        return done(null, newUser, { isNewAccount: true });
      } catch (err) {
        console.error("[GoogleStrategy] error:", err);
        return done(err);
      }
    }
  )
);

/**
 * NOTE:
 * You are using session:false in the /google/callback route.
 * These serialize/deserialize are harmless to keep, but not used for that route.
 */
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id);
    done(null, u);
  } catch (e) {
    done(e);
  }
});

export default passport;