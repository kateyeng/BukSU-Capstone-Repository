import { useState } from "react";

export default function ResetPassword({ email, onBack, onResetDone }) {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // TODO: API call to save new password
    // await api.resetPassword(email, form.password);

    alert("Password reset successfully!");
    onResetDone();
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

      {/* New Password */}
      <div>
        <label>New Password</label>
        <div className="input-box has-icon">
          <span className="input-icon">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5h-9z" />
              <path d="M5 10.5A1.5 1.5 0 0 0 3.5 12v7A1.5 1.5 0 0 0 5 20.5h14A1.5 1.5 0 0 0 20.5 19v-7A1.5 1.5 0 0 0 19 10.5H5z" />
            </svg>
          </span>
          <input
            type="password"
            name="password"
            placeholder="Enter new password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label>Re-enter Password</label>
        <div className="input-box has-icon">
          <span className="input-icon">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5h-9z" />
              <path d="M5 10.5A1.5 1.5 0 0 0 3.5 12v7A1.5 1.5 0 0 0 5 20.5h14A1.5 1.5 0 0 0 20.5 19v-7A1.5 1.5 0 0 0 19 10.5H5z" />
            </svg>
          </span>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <button className="btn-primary" type="submit">
        Reset Password
      </button>
    </form>
  );
}
