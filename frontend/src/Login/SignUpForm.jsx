import { useState } from "react";

export default function SignUpForm({ onSwitch }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }
    alert(`Account created for ${form.name}\nEmail: ${form.email}`);
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {/* Full Name */}
      <div>
        <label>Full Name</label>
        <div className="input-box has-icon">
          <span className="input-icon">
            {/* User Icon */}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2.2c-4.2 0-7.6 2-7.6 4.5V21h15.2v-2.3c0-2.5-3.4-4.5-7.6-4.5z"/>
            </svg>
          </span>
          <input
            name="name"
            placeholder="Juan Dela Cruz"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label>Email</label>
        <div className="input-box has-icon">
          <span className="input-icon">
            {/* Mail Icon */}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M1.5 7.5v9A1.5 1.5 0 0 0 3 18h18a1.5 1.5 0 0 0 1.5-1.5v-9L12 12 1.5 7.5z"/>
              <path d="M22.5 6V5.5A1.5 1.5 0 0 0 21 4H3A1.5 1.5 0 0 0 1.5 5.5V6L12 10.5 22.5 6z"/>
            </svg>
          </span>
          <input
            type="email"
            name="email"
            placeholder="your.email@buksu.edu.ph"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label>Password</label>
        <div className="input-box has-icon">
          <span className="input-icon">
            {/* Lock Icon */}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5h-9z"/>
              <path d="M5 10.5A1.5 1.5 0 0 0 3.5 12v7A1.5 1.5 0 0 0 5 20.5h14A1.5 1.5 0 0 0 20.5 19v-7A1.5 1.5 0 0 0 19 10.5H5z"/>
            </svg>
          </span>
          <input
            type="password"
            name="password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label>Confirm Password</label>
        <div className="input-box has-icon">
          <span className="input-icon">
            {/* Lock Icon */}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5h-9z"/>
              <path d="M5 10.5A1.5 1.5 0 0 0 3.5 12v7A1.5 1.5 0 0 0 5 20.5h14A1.5 1.5 0 0 0 20.5 19v-7A1.5 1.5 0 0 0 19 10.5H5z"/>
            </svg>
          </span>
          <input
            type="password"
            name="confirm"
            placeholder="Confirm your password"
            value={form.confirm}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <button className="btn-primary" type="submit">
        Create Account
      </button>

      <p className="text-center">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{ background: "none", color: "#1e40af" }}
        >
          Login
        </button>
      </p>
    </form>
  );
}
