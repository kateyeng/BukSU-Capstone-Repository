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

export const sendPasswordChangedEmail = async (email, fullName, opts = {}) => {
  const {
    ip = 'Unknown IP',
    userAgent = 'Unknown device',
    when = new Date(),
  } = opts;

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your BukSU Repository password was changed',
      html: `
      <div style="font-family: Arial, sans-serif; background-color:#f9fbff; padding:30px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.06);">
          <div style="padding:24px 24px 0; text-align:center;">
            <img src="https://buksu.edu.ph/wp-content/uploads/2020/05/buksu-logo-min-1024x1024.png" alt="BukSU Logo" style="max-width:100px; height:auto; display:inline-block;">
          </div>
          <div style="padding:0 24px 24px;">
            <h2 style="color:#003366; font-size:20px; text-align:center; margin:12px 0 16px;">
              Hi ${fullName || 'there'}, your password has been changed
            </h2>

            <p style="color:#444; line-height:1.6; margin:0 0 14px;">
              This is a confirmation that the password for your account has just been updated.
            </p>

            <div style="background:#f2f7ff; border-radius:6px; padding:14px; margin:16px 0;">
              <p style="margin:0 0 6px; color:#003366; font-weight:600;">Security details</p>
              <p style="margin:0; color:#555; font-size:14px;">
                Time: ${when.toLocaleString()}<br/>
                IP: ${ip}<br/>
                Device: ${userAgent}
              </p>
            </div>

            <p style="color:#444; line-height:1.6; margin:0 0 14px;">
              If <strong>you</strong> made this change, no further action is needed.
            </p>
            <p style="color:#444; line-height:1.6; margin:0 0 18px;">
              If you <strong>did not</strong> change your password, please reset it immediately and contact support.
            </p>

            <div style="text-align:center; margin:18px 0;">
              <a href="${process.env.CLIENT_URL}/login" style="display:inline-block; background:#004a99; color:#fff; padding:10px 18px; border-radius:5px; text-decoration:none; font-weight:600;">Go to Login</a>
              &nbsp;&nbsp;
              <a href="${process.env.CLIENT_URL}/forgot-password" style="display:inline-block; border:1px solid #004a99; color:#004a99; padding:10px 18px; border-radius:5px; text-decoration:none; font-weight:600;">Reset Password</a>
            </div>

            <p style="color:#666; font-size:14px; margin:0 0 12px;">
              Need help? Email
              <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}" style="color:#004a99; text-decoration:none;">
                ${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}
              </a>.
            </p>

            <hr style="border:none; border-top:1px solid #e0e0e0; margin:20px 0;">
            <p style="color:#999; font-size:12px; text-align:center; margin:0 0 18px;">
              Bukidnon State University • Institutional Repository System
            </p>
          </div>
        </div>
      </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('[PasswordChangedEmail] sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[PasswordChangedEmail] error:', error);
    return { success: false, error: error.message };
  }
};

const appBrand = 'BukSU Repository';
const appLogo = 'https://buksu.edu.ph/wp-content/uploads/2020/05/buksu-logo-min-1024x1024.png';
const fromAddr = process.env.EMAIL_USER;

function wrapCard({ title, bodyHtml }) {
  return `
  <div style="font-family:Arial,sans-serif;background:#f9fbff;padding:30px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
      <div style="padding:24px 24px 0;text-align:center;">
        <img src="${appLogo}" alt="${appBrand} Logo" style="max-width:110px;height:auto;display:inline-block;">
      </div>
      <div style="padding:0 24px 24px;">
        <h2 style="color:#003366;font-size:20px;text-align:center;margin:12px 0 18px;">${title}</h2>
        ${bodyHtml}
        <div style="text-align:center;margin:18px 0;">
          <a href="${process.env.CLIENT_URL || '#'}" style="display:inline-block;background:#004a99;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open ${appBrand}</a>
        </div>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;">
        <p style="color:#999;font-size:12px;text-align:center;margin:0 0 18px;">Bukidnon State University • Institutional Repository System</p>
      </div>
    </div>
  </div>`;
}

export const sendThesisApprovedEmail = async ({ to, title, year, category }) => {
  try {
    const transporter = createTransporter();
    const subject = `Thesis Approved: ${title}`;
    const html = wrapCard({
      title: "Your thesis has been approved",
      bodyHtml: `
        <p style="color:#444;line-height:1.6;margin:0 0 12px;">
          Your submission <strong>${title}</strong>${year ? ` (${year})` : ""}${category ? ` in <em>${category}</em>` : ""} has been <strong>approved</strong> by the admin.
        </p>
        <p style="color:#444;line-height:1.6;margin:0 0 12px;">It is now visible in the repository.</p>
      `,
    });
    const result = await transporter.sendMail({ from: fromAddr, to, subject, html });
    return { success: true, messageId: result.messageId };
  } catch (e) {
    console.error('[sendThesisApprovedEmail] error:', e);
    return { success: false, error: e.message };
  }
};

export const sendThesisRejectedEmail = async ({ to, title, year, category, reason }) => {
  try {
    const transporter = createTransporter();
    const subject = `Thesis Rejected: ${title}`;
    const html = wrapCard({
      title: "Your thesis was rejected",
      bodyHtml: `
        <p style="color:#444;line-height:1.6;margin:0 0 12px;">
          Your submission <strong>${title}</strong>${year ? ` (${year})` : ""}${category ? ` in <em>${category}</em>` : ""} was <strong>rejected</strong>.
        </p>
        ${reason ? `<p style="color:#444;line-height:1.6;margin:0 0 12px;"><strong>Reason:</strong> ${reason}</p>` : ""}
        <p style="color:#444;line-height:1.6;margin:0 0 12px;">You may revise and resubmit if applicable.</p>
      `,
    });
    const result = await transporter.sendMail({ from: fromAddr, to, subject, html });
    return { success: true, messageId: result.messageId };
  } catch (e) {
    console.error('[sendThesisRejectedEmail] error:', e);
    return { success: false, error: e.message };
  }
};

export const sendThesisEditedEmail = async ({ to, title, changes = {} }) => {
  try {
    const transporter = createTransporter();
    const subject = `Thesis Updated by Admin: ${title}`;

    const list = Object.entries(changes)
      .map(([k, { from, to }]) => {
        const fmt = (v) => (Array.isArray(v) ? v.join(', ') : (v ?? '—'));
        return `<li><strong>${k}</strong>: “${fmt(from)}” → “${fmt(to)}”</li>`;
      })
      .join("");

    const html = wrapCard({
      title: "Your submission was updated",
      bodyHtml: `
        <p style="color:#444;line-height:1.6;margin:0 0 12px;">
          An admin edited your thesis: <strong>${title}</strong>.
        </p>
        ${list ? `<ul style="color:#444;line-height:1.6;margin:0 0 12px 20px;">${list}</ul>` : ""}
      `,
    });

    const result = await transporter.sendMail({ from: fromAddr, to, subject, html });
    return { success: true, messageId: result.messageId };
  } catch (e) {
    console.error('[sendThesisEditedEmail] error:', e);
    return { success: false, error: e.message };
  }
};