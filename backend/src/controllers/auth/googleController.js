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


export default User;