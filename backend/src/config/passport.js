import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
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
      }
    }
  )
);

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