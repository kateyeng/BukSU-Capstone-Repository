import User from "../../models/user.model.js";
import bcrypt from 'bcryptjs';
import { generateResetCode, generateResetToken, hashResetToken } from '../../utils/passwordReset.js';
import { sendPasswordResetEmail } from '../../utils/email.js';


export async function forgotPasswordUser (req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset code and token
    const resetCode = generateResetCode();
    const resetToken = generateResetToken();

    // Save reset token and expiry (15 minutes)
    user.resetPasswordToken = hashResetToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetCode = resetCode;
    user.resetPasswordToken = resetToken;
    await user.save();

    // Send email with reset code
    const emailResult = await sendPasswordResetEmail(email, resetCode);

    if (emailResult.success) {
      res.status(200).json({
        message: 'Reset code sent to your email',
        resetToken, // Send token to client for verification
      });
      console.log('Reset Token (for testing):', resetToken);
      console.log('Reset Code (for testing):', resetCode);
    } else {
      res.status(500).json({ message: 'Failed to send reset email' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function resetPasswordUser (req, res) {
  try {
    const { resetToken, code, newPassword } = req.body;

    if (!resetToken || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      console.log(resetToken);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Verify reset code
    if (code !== user.resetCode) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.resetCode = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if reset code and expiration exist
    if (!user.resetCode || !user.resetPasswordExpires) {
      return res.status(400).json({ message: 'No reset request found' });
    }

    // Check if code is expired
    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    // Compare codes
    if (user.resetCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // ✅ Optional: Return the token to allow password reset
    res.status(200).json({
      message: 'Code verified successfully',
      resetToken: user.resetPasswordToken,
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export default User;