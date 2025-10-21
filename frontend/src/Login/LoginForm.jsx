// src/Login/LoginForm.jsx
import { useState } from "react";

/* eslint-disable react/prop-types */
export default function LoginForm({ onSwitch, onForgot, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    // TODO: replace with real auth
    onSuccess(); // -> App switches to "dashboard"
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {/* Email */}
      <div>
        <label>Email</label>
        <div className="input-box has-icon">
          <span className="input-icon" aria-hidden>
            {/* mail icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16v12H4z" stroke="#9ca3af" strokeWidth="1.6" rx="2" />
              <path d="M4 7l8 6 8-6" stroke="#9ca3af" strokeWidth="1.6" fill="none" />
            </svg>
          </span>
          <input
            type="email"
            placeholder="your.email@buksu.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label>Password</label>
        <div className="input-box has-icon">
          <span className="input-icon" aria-hidden>
            {/* lock icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="#9ca3af" strokeWidth="1.6" />
              <path d="M8 11V8a4 4 0 118 0v3" stroke="#9ca3af" strokeWidth="1.6" />
            </svg>
          </span>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Forgot link */}
      <div className="text-right">
        <button type="button" className="link" onClick={onForgot}>
          Forgot Password?
        </button>
      </div>

      {/* CTA */}
      <button type="submit" className="btn-primary">Login</button>

      {/* Switch */}
      <div className="text-center" style={{ marginTop: 10 }}>
        Don’t have an account?{" "}
        <button type="button" className="link" onClick={onSwitch}>
          Sign Up
        </button>
      </div>
    </form>
  );
}
