<<<<<<< HEAD
import { useState } from "react";
import axios from "axios";

export default function ResetPassword({ email, resetToken, code, onBack, onResetDone }) {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // 🧩 Debug log — this helps confirm what’s being sent
    console.log("🔍 Sending reset request:", {
      resetToken,
      code,
      newPassword: form.password,
    });

    try {
      const res = await axios.post("http://localhost:3000/api/auth/resetPassword", {
        resetToken,
        code,
        newPassword: form.password,
      });

      alert("✅ " + res.data.message);
      onResetDone();
    } catch (err) {
      console.error("❌ Reset failed:", err.response?.data);
      alert(err.response?.data?.message || "Reset failed");
=======
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axios.js";
import toast from "react-hot-toast";

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
    tokenProp || tokenFromUrl || localStorage.getItem("resetToken") || "";
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
      toast.error("Please verify the code first.");
      handleBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      toast.error("Missing reset token. Open the reset link again.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    const payload = {
      resetToken,
      code,
      newPassword: form.password,
    };

    try {
      const resetPromise = axios.post("/api/auth/resetPassword", payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      await toast.promise(
        resetPromise,
        {
          loading: "Resetting password...",
          success: (res) =>
            res.data?.message || "Password reset successfully!",
          error: (err) =>
            err?.response?.data?.message ||
            "Reset failed. Please check your code.",
        },
        { duration: 3000 }
      );

      // Cleanup
      localStorage.removeItem("resetToken");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetCode");

      onResetDone?.();

      if (!onResetDone) {
        navigate("/login");
      }
    } catch (err) {
      console.error("❌ Reset failed:", err?.response?.data || err);
>>>>>>> major-changes
    }
  };

  return (
<<<<<<< HEAD
    <form className="form" onSubmit={handleSubmit}>
      <div style={{ marginBottom: 6 }}>
        <button type="button" className="link" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div style={{ marginBottom: 10, color: "#555", fontSize: 14 }}>
        Set a new password for <b>{email}</b>
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
=======
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
>>>>>>> major-changes
  );
}
