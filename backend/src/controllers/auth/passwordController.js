import User from "../../models/user.model.js";
import bcrypt from 'bcryptjs';
import { generateResetCode, generateResetToken, hashResetToken } from '../../utils/passwordReset.js';
import { sendPasswordResetEmail , sendPasswordChangedEmail } from '../../utils/email.js';
import { validateStrongPassword } from "../../utils/passwordPolicy.js";
import { logActivity } from "../../utils/activityLogger.js";


export async function forgotPasswordUser (req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({
      success: 'false',
      message: 'Email is required'
    });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({
      success: false,
      message: "No account found with this email"
    });

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
      success: "true",
      message: 'Verification code sent to your email',
      resetToken,
    });

    console.log('Reset Token (for testing):', resetToken);
    console.log('Reset Code (for testing):', resetCode);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}


export async function resetPasswordUser (req, res) {
  try {
    const { resetToken, code, newPassword } = req.body;

    if (!resetToken || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required' 
      });
    }
    const passwordCheck = validateStrongPassword(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    // Hash incoming token to match stored hash
    const tokenHash = hashResetToken(resetToken);

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      console.error('[resetPasswordUser] User not found with valid token');
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token" 
      });
    }

    if (code !== user.resetCode) {
      console.error('[resetPasswordUser] Code mismatch. Expected:', user.resetCode, 'Got:', code);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.resetCode = null;
    await user.save();

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


export async function verifyResetCode(req, res) {
  try {
    const { email, code, resetToken } = req.body;

    // 🔹 1) Required fields check
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and code are required",
      });
    }

    // 🔹 2) Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (
      !user ||
      !user.resetPasswordToken ||
      !user.resetPasswordExpires ||
      !user.resetCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // 🔹 3) Check if expired
    if (user.resetPasswordExpires < new Date()) {
      // optional: clear fields on expiry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.resetCode = undefined;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // 🔹 4) Check code match
    if (user.resetCode !== code) {
      console.error('[verifyResetCode] Code mismatch. Expected:', user.resetCode, 'Got:', code);
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // 🔹 5) (Recommended) also validate resetToken from client
    // If you want this to be required, keep this block.
    // If your frontend doesn't send resetToken here, you can remove this part.
    if (resetToken) {
      const tokenHash = hashResetToken(resetToken);
      if (user.resetPasswordToken !== tokenHash) {
        console.error('[verifyResetCode] Token mismatch. Stored:', user.resetPasswordToken?.substring(0, 10), '... Got hash:', tokenHash?.substring(0, 10), '...');
        return res.status(400).json({
          success: false,
          message: "Invalid reset token",
        });
      }
    } else {
      console.warn('[verifyResetCode] No resetToken provided in request');
    }

    // 🔹 6) All good → success response
    return res.status(200).json({
      success: true,
      message: "Code verified successfully",
      resetToken, // just echoing back what client sent
    });
  } catch (err) {
    console.error("verifyResetCode error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function changePasswordUser(req, res) {
  try {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const passwordCheck = validateStrongPassword(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google login only.",
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (sameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

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

    await logActivity(
      req,
      "password_change",
      { userId: String(user._id) },
      user
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error('changePasswordUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

export default User;
