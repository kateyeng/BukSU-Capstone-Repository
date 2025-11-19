import { useState, useEffect } from "react";
import axios from "../api/axios.js";

export default function ResetPassword({ email: emailProp, resetToken: tokenProp, onBack, onResetDone }) {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  // Resolve token/email from props → URL → localStorage
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  const emailFromUrl = params.get("email");

  const resetToken = tokenProp || tokenFromUrl || localStorage.getItem("resetToken") || "";
  const email = emailProp || emailFromUrl || localStorage.getItem("resetEmail") || "";
  const code = localStorage.getItem("resetCode") || ""; // ← pulled silently

  useEffect(() => {
    if (!code) {
      alert("Please verify the code first.");
      onBack?.(); // or navigate to your Code step
    }
  }, [code, onBack]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) return alert("Missing reset token. Open the reset link again.");
    if (form.password.length < 6) return alert("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return alert("Passwords do not match!");

    const payload = { resetToken, code, newPassword: form.password }; // code sent silently
    try {
      const res = await axios.post("/api/auth/resetPassword", payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      alert(res.data?.message || "Password reset successfully");

      // cleanup
      localStorage.removeItem("resetToken");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetCode");

      onResetDone?.();
    } catch (err) {
      alert(err?.response?.data?.message || "Reset failed");
      console.error("❌ Reset failed:", err?.response?.data || err);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div style={{ marginBottom: 6 }}>
        <button type="button" className="link" onClick={onBack}>← Back</button>
      </div>

      <div style={{ marginBottom: 10, color: "#555", fontSize: 14 }}>
        Set a new password for <b>{email || "your account"}</b>
      </div>

      <div>
        <label>New Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter new password"
          value={form.password}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Re-enter Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>

      <button className="btn-primary" type="submit">Reset Password</button>
    </form>
  );
}
