// passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase() || null;
      if (!email) return done(null, false, { message: 'Google account has no email' });

      // 1) Known googleId → returning user
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        console.log('[Google] found by googleId:', user.email, 'role:', user.role);
        return done(null, user, { isNewAccount: false });
      }

      // 2) Existing local account with same email → link (not new)
      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        user.profilePic = user.profilePic || profile.photos?.[0]?.value || '';
        user.isEmailVerified = true;
        user.provider = 'google';
        await user.save();
        console.log('[Google] linked to existing user:', user.email, 'role:', user.role);
        return done(null, user, { isNewAccount: false, linkedGoogle: true });
      }

      // 3) First-time Google login → create (NEW)
      user = await User.create({
        fullName: profile.displayName || 'New Student',
        email,
        googleId: profile.id,
        profilePic: profile.photos?.[0]?.value || '',
        role: 'student',
        isEmailVerified: true,
        provider: 'google',
        // optional guard to avoid duplicates later:
        welcomeEmailSentAt: null,
      });

      console.log('[Google] created new STUDENT:', user.email);
      return done(null, user, { isNewAccount: true });
    } catch (err) {
      console.error('GoogleStrategy error:', err);
      return done(err);
    }
  }
));

// (de)serialize if you use sessions
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try { const u = await User.findById(id); done(null, u); } catch (e) { done(e); }
});

export default passport;
