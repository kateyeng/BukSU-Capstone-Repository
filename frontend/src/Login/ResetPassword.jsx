import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axios.js";

export default function ResetPassword({
  email: emailProp,
  resetToken: tokenProp,
  onBack,
  onResetDone,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  // Resolve token/email from props → URL → location.state → localStorage
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  const emailFromUrl = params.get("email");
  const emailFromState = location.state?.email;

  const resetToken =
    tokenProp ||
    tokenFromUrl ||
    localStorage.getItem("resetToken") ||
    "";
  const email =
    emailProp ||
    emailFromUrl ||
    emailFromState ||
    localStorage.getItem("resetEmail") ||
    "";
  const code = localStorage.getItem("resetCode") || "";

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/code");
  };

  useEffect(() => {
    if (!code) {
      alert("Please verify the code first.");
      handleBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      alert("Missing reset token. Open the reset link again.");
      return;
    }
    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const payload = {
      resetToken,
      code,
      newPassword: form.password,
    };

    try {
      const res = await axios.post("/api/auth/resetPassword", payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      alert(res.data?.message || "Password reset successfully");

      // Cleanup
      localStorage.removeItem("resetToken");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetCode");

      onResetDone?.();

      if (!onResetDone) {
        navigate("/login");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Reset failed");
      console.error("❌ Reset failed:", err?.response?.data || err);
    }
  };

  return (
    <div className="auth-page">
      {/* Header */}
      <header className="header">
        <h1>BukSU CoT Thesis Realm</h1>
        <p>Choose a new password</p>
      </header>

      {/* Card */}
      <div className="container">
        <div className="tabs">
          <button className="tab active" type="button">
            Reset Password
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: 6 }}>
            <button type="button" className="link" onClick={handleBack}>
              ← Back
            </button>
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

          <button className="btn-primary" type="submit">
            Reset Password
          </button>
        </form>
      </div>

      <button
        type="button"
        className="link back-home"
        onClick={() => navigate("/")}
      >
        ← Back to Home
      </button>
    </div>
  );
}
