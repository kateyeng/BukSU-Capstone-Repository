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
    }
  };

  return (
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
  );
}
