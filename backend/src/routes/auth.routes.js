import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import { loginUser, registerUser, logoutUser } from "../controllers/auth/userAuthController.js";
import { forgotPasswordUser, resetPasswordUser, verifyResetCode, } from '../controllers/auth/passwordController.js';
import { googleCallBack } from '../controllers/auth/googleController.js';
import { protect } from '../middleware/auth.js';
dotenv.config();

const router = express.Router();

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
  }),
  googleCallBack
);


export default router;
