import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER, // use the configured sender address
      to: email,
      subject: 'Password Reset Code - Buksu Repository',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password. Use the code below to reset your password:</p>
          
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${resetCode}</h1>
          </div>
          
          <p><strong>This code will expire in 15 minutes.</strong></p>
          
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.response);
    console.log('Password reset email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, fullName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Buksu Repository!',
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9fbff; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          
          <div style="padding: 24px 24px 0; text-align: center;">
            <img
              src="https://buksu.edu.ph/wp-content/uploads/2020/05/buksu-logo-min-1024x1024.png"
              alt="BukSU Repository Logo"
              style="max-width: 140px; height: auto; display: inline-block; margin-bottom: 12px;"
            />
          </div>

          <div style="padding: 0 24px 24px;">
            <h1 style="color: #003366; font-size: 22px; margin: 8px 0 12px; text-align: center;">
              Welcome to the BukSU Repository, ${fullName}!
            </h1>

            <p style="color: #444; line-height: 1.6; margin: 0 0 16px; text-align: center;">
              Thank you for registering with the Bukidnon State University Institutional Repository System.
              You can now upload, manage, and access academic and research materials securely.
            </p>

            <div style="background: linear-gradient(180deg, #fff 0%, #f2f7ff 100%); border-radius: 6px; padding: 18px; margin: 16px 0; text-align: center;">
              <p style="margin: 0 0 8px; color: #003366; font-weight: 600;">Next Steps</p>
              <p style="margin: 0 0 12px; color: #555; font-size: 14px;">
                Complete your profile and start uploading your research works to the repository.
              </p>
              <a href="${process.env.CLIENT_URL}/dashboard"
                style="display: inline-block; background-color: #004a99; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin: 0 0 12px;">
              For any assistance or inquiries, contact the repository support team at
              <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}" style="color: #004a99; text-decoration: none;">
                ${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}
              </a>.
            </p>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0 0 18px;">
              Bukidnon State University • Institutional Repository System
            </p>

            <p style="color: #aaa; font-size: 11px; text-align: center; margin: 0 0 24px;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </div>

      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};


