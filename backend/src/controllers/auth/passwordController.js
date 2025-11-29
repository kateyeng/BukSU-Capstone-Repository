import User from "../../models/user.model.js";
import bcrypt from 'bcryptjs';
import { generateResetCode, generateResetToken, hashResetToken } from '../../utils/passwordReset.js';
<<<<<<< HEAD
import { sendPasswordResetEmail } from '../../utils/email.js';
=======
import { sendPasswordResetEmail , sendPasswordChangedEmail } from '../../utils/email.js';
>>>>>>> major-changes


export async function forgotPasswordUser (req, res) {
  try {
    const { email } = req.body;
<<<<<<< HEAD

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
=======
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetCode = generateResetCode();
    const resetToken = generateResetToken();

    // Store ONLY the hash + expiry + code
    user.resetPasswordToken = hashResetToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.resetCode = resetCode;
    await user.save();

    const emailResult = await sendPasswordResetEmail(user.email, resetCode);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send reset email' });
    }

    // Return raw token to client (keep it client-side)
    res.status(200).json({
      message: 'Reset code sent to your email',
      resetToken,
    });

    console.log('Reset Token (for testing):', resetToken);
    console.log('Reset Code (for testing):', resetCode);
>>>>>>> major-changes
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

<<<<<<< HEAD
=======

>>>>>>> major-changes
export async function resetPasswordUser (req, res) {
  try {
    const { resetToken, code, newPassword } = req.body;

    if (!resetToken || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
<<<<<<< HEAD

=======
>>>>>>> major-changes
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

<<<<<<< HEAD
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
=======
    // Hash incoming token to match stored hash
    const tokenHash = hashResetToken(resetToken);

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
>>>>>>> major-changes
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
<<<<<<< HEAD
      console.log(resetToken);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Verify reset code
=======
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

>>>>>>> major-changes
    if (code !== user.resetCode) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

<<<<<<< HEAD
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset fields
    user.password = hashedPassword;
=======
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

>>>>>>> major-changes
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.resetCode = null;
    await user.save();

<<<<<<< HEAD
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

=======
    // === INSERT: fire-and-forget "password changed" email ===
    const ip =
      (req.headers['x-forwarded-for']?.split(',')[0] || '').trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'Unknown IP';

    const userAgent = req.headers['user-agent'] || 'Unknown device';

    sendPasswordChangedEmail(user.email, user.fullName, {
      ip,
      userAgent,
      when: new Date(),
    })
      .then((r) => {
        if (!r?.success) {
          console.error('[PasswordChangedEmail] failed:', r?.error);
        }
      })
      .catch((e) => {
        console.error('[PasswordChangedEmail] unhandled error:', e);
      });
    // === END INSERT

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}


>>>>>>> major-changes
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
<<<<<<< HEAD
      resetToken: user.resetPasswordToken,
=======
>>>>>>> major-changes
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export default User;