import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

/* =========================
   Password Reset Email
========================= */
export const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code - Buksu Repository",
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
    console.log("[PasswordResetEmail] sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("[PasswordResetEmail] error:", error);
    return { success: false, error: error.message };
  }
};

/* =========================
   Email Verification
========================= */
export const sendEmailVerification = async (email, fullName, verifyUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email - BukSU Repository",
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
              Verify your email, ${fullName}!
            </h1>

            <p style="color: #444; line-height: 1.6; margin: 0 0 16px; text-align: center;">
              Thanks for registering to BukSU Repository. Please verify your email to activate your account.
            </p>

            <div style="text-align: center; margin: 22px 0;">
              <a href="${verifyUrl}"
                style="display: inline-block; background-color: #004a99; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: 600;">
                Verify Email
              </a>
            </div>

            <p style="color: #666; font-size: 13px; margin: 10px 0 0; text-align: center;">
              If the button doesn't work, copy and paste this link:
            </p>
            <p style="color: #004a99; font-size: 12px; word-break: break-all; text-align: center; margin: 6px 0 16px;">
              ${verifyUrl}
            </p>

            <p style="color: #666; font-size: 14px; margin: 0 0 12px;">
              If you didn't create this account, you can ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

            <p style="color: #aaa; font-size: 11px; text-align: center; margin: 0;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("[EmailVerification] sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("[EmailVerification] error:", error);
    return { success: false, error: error.message };
  }
};

/* =========================
   ✅ Welcome Email (NEW EXPORT)
========================= */
export const sendWelcomeEmail = async (email, fullName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to BukSU Repository!",
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
              Welcome to the BukSU Repository, ${fullName || "User"}!
            </h1>

            <p style="color: #444; line-height: 1.6; margin: 0 0 16px; text-align: center;">
              Your account is ready. You can now access and manage academic research materials securely.
            </p>

            <div style="text-align:center; margin:18px 0;">
              <a href="${process.env.CLIENT_URL}/login"
                style="display:inline-block; background:#004a99; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none; font-weight:600;">
                Go to Login
              </a>
            </div>

            <hr style="border:none; border-top:1px solid #e0e0e0; margin:20px 0;">
            <p style="color:#aaa; font-size:11px; text-align:center; margin:0;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("[WelcomeEmail] sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("[WelcomeEmail] error:", error);
    return { success: false, error: error.message };
  }
};

/* =========================
   Password Changed Email
========================= */
export const sendPasswordChangedEmail = async (email, fullName, opts = {}) => {
  const { ip = "Unknown IP", userAgent = "Unknown device", when = new Date() } = opts;

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your BukSU Repository password was changed",
      html: `
      <div style="font-family: Arial, sans-serif; background-color:#f9fbff; padding:30px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.06);">
          <div style="padding:24px 24px 0; text-align:center;">
            <img src="https://buksu.edu.ph/wp-content/uploads/2020/05/buksu-logo-min-1024x1024.png" alt="BukSU Logo" style="max-width:100px; height:auto; display:inline-block;">
          </div>
          <div style="padding:0 24px 24px;">
            <h2 style="color:#003366; font-size:20px; text-align:center; margin:12px 0 16px;">
              Hi ${fullName || "there"}, your password has been changed
            </h2>

            <div style="background:#f2f7ff; border-radius:6px; padding:14px; margin:16px 0;">
              <p style="margin:0 0 6px; color:#003366; font-weight:600;">Security details</p>
              <p style="margin:0; color:#555; font-size:14px;">
                Time: ${when.toLocaleString()}<br/>
                IP: ${ip}<br/>
                Device: ${userAgent}
              </p>
            </div>

            <div style="text-align:center; margin:18px 0;">
              <a href="${process.env.CLIENT_URL}/login" style="display:inline-block; background:#004a99; color:#fff; padding:10px 18px; border-radius:5px; text-decoration:none; font-weight:600;">Go to Login</a>
            </div>

            <hr style="border:none; border-top:1px solid #e0e0e0; margin:20px 0;">
            <p style="color:#999; font-size:12px; text-align:center; margin:0;">
              Bukidnon State University • Institutional Repository System
            </p>
          </div>
        </div>
      </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("[PasswordChangedEmail] sent:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("[PasswordChangedEmail] error:", error);
    return { success: false, error: error.message };
  }
};

/* =========================
   Thesis Emails (your existing)
========================= */
const appBrand = "BukSU Repository";
const appLogo =
  "https://buksu.edu.ph/wp-content/uploads/2020/05/buksu-logo-min-1024x1024.png";
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
          <a href="${process.env.CLIENT_URL || "#"}" style="display:inline-block;background:#004a99;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open ${appBrand}</a>
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
          Your submission <strong>${title}</strong>${year ? ` (${year})` : ""}${
        category ? ` in <em>${category}</em>` : ""
      } has been <strong>approved</strong> by the admin.
        </p>
        <p style="color:#444;line-height:1.6;margin:0 0 12px;">It is now visible in the repository.</p>
      `,
    });
    const result = await transporter.sendMail({ from: fromAddr, to, subject, html });
    return { success: true, messageId: result.messageId };
  } catch (e) {
    console.error("[sendThesisApprovedEmail] error:", e);
    return { success: false, error: e.message };
  }
};

export const sendThesisRejectedEmail = async ({
  to,
  title,
  year,
  category,
  reason,
}) => {
  try {
    const transporter = createTransporter();
    const subject = `Thesis Rejected: ${title}`;
    const html = wrapCard({
      title: "Your thesis was rejected",
      bodyHtml: `
        <p style="color:#444;line-height:1.6;margin:0 0 12px;">
          Your submission <strong>${title}</strong>${year ? ` (${year})` : ""}${
        category ? ` in <em>${category}</em>` : ""
      } was <strong>rejected</strong>.
        </p>
        ${
          reason
            ? `<p style="color:#444;line-height:1.6;margin:0 0 12px;"><strong>Reason:</strong> ${reason}</p>`
            : ""
        }
        <p style="color:#444;line-height:1.6;margin:0 0 12px;">You may revise and resubmit if applicable.</p>
      `,
    });
    const result = await transporter.sendMail({ from: fromAddr, to, subject, html });
    return { success: true, messageId: result.messageId };
  } catch (e) {
    console.error("[sendThesisRejectedEmail] error:", e);
    return { success: false, error: e.message };
  }
};

export const sendThesisEditedEmail = async ({ to, title, changes = {} }) => {
  try {
    const transporter = createTransporter();
    const subject = `Thesis Updated by Admin: ${title}`;

    const list = Object.entries(changes)
      .map(([k, { from, to }]) => {
        const fmt = (v) => (Array.isArray(v) ? v.join(", ") : v ?? "—");
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
    console.error("[sendThesisEditedEmail] error:", e);
    return { success: false, error: e.message };
  }
};