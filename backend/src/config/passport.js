<<<<<<< HEAD
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';

// Configure Google OAuth Strategy
=======
// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

>>>>>>> major-changes
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
<<<<<<< HEAD
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth Profile:', profile);

        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (email) {
          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.profilePic = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        user = new User({
          googleId: profile.id,
          fullName: profile.displayName || 'Google User',
          email: email || '',
          profilePic: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          isEmailVerified: true,
        });

        await user.save();
        return done(null, user);
      } catch (error) {
        console.error('Google OAuth Strategy Error:', error);
        return done(error, null);
=======
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase() || null;
        if (!email)
          return done(null, false, { message: "Google account has no email" });

        // 1) Known googleId → returning user
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          console.log(
            "[Google] found by googleId:",
            user.email,
            "role:",
            user.role
          );
          return done(null, user, { isNewAccount: false });
        }

        // 2) Existing local account with same email → link (not new)
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          user.profilePic =
            user.profilePic || profile.photos?.[0]?.value || "";
          user.isEmailVerified = true;
          user.provider = "google";
          await user.save();
          console.log(
            "[Google] linked to existing user:",
            user.email,
            "role:",
            user.role
          );
          return done(null, user, { isNewAccount: false, linkedGoogle: true });
        }

        // 3) First-time Google login → create as GUEST (pending)
        user = await User.create({
          fullName: profile.displayName || "New User",
          email,
          googleId: profile.id,
          profilePic: profile.photos?.[0]?.value || "",
          role: "guest", // ❗ pending until admin/teacher upgrades role
          isEmailVerified: true,
          provider: "google",
          welcomeEmailSentAt: null,
        });

        console.log("[Google] created new GUEST:", user.email);
        return done(null, user, { isNewAccount: true });
      } catch (err) {
        console.error("GoogleStrategy error:", err);
        return done(err);
>>>>>>> major-changes
      }
    }
  )
);

<<<<<<< HEAD
// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
=======
// (de)serialize if you use sessions
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
>>>>>>> major-changes
