// src/pages/LoginPage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import ReCAPTCHA from "react-google-recaptcha";

/* eslint-disable react/prop-types */
export default function LoginPage({ setUser }) {
  const navigate = useNavigate();

  // Super-forgiving role normalizer
  const normRole = (v) => {
    const raw = String(v || "").toLowerCase().trim();
    const compact = raw.replace(/\s+/g, "");
    if (raw.includes("admin") || compact === "admin") return "admin";
    if (raw.includes("teach") || compact === "teacher") return "teacher";
    if (raw.includes("stud") || compact === "student") return "student";
    return "guest";
  };

  // Called after API login success
  const handleLoginSuccess = (user) => {
    console.log("Logged in user:", user);

    const role = normRole(user?.role);
    const userSafe = { ...user, role };

    // 🔑 This is what App.jsx needs
    setUser?.(userSafe);

    // Redirect by role
    if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "teacher") navigate("/teacher", { replace: true });
    else if (role === "student") navigate("/student", { replace: true });
    else navigate("/dashboard", { replace: true }); // fallback → public
  };

  return (
    <div className="auth-page">
      {/* Header */}
      <header className="header">
        <h1>BukSU CoT Thesis Realm</h1>
        <p>Access your academic research portal</p>
      </header>

      {/* Card */}
      <div className="container">
        {/* Title strip */}
        <div className="tabs">
          <button className="tab active" type="button">
            Login
          </button>
        </div>

        {/* Login Form with logic */}
        <LoginForm
          onSwitch={() => navigate("/signup")}
          onForgot={() => navigate("/forgot")}
          onSuccess={handleLoginSuccess}
        />
      </div>

      {/* Back Home */}
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

/* ===========================
   Inner LoginForm component
   =========================== */
function LoginForm({ onSwitch, onForgot, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const recaptchaRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        recaptchaRef.current?.reset();
      } catch {
        // ignore
      }
    };
  }, []);

  const handleGoogleLogin = () => {
    const url = `${import.meta.env.VITE_API_URL}/api/auth/google`;
    window.location.href = url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Please enter email & password");
    if (!captcha) return alert("Please verify CAPTCHA");

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", {
        email,
        password,
        captcha,
      });

      alert(data.message || "Login successful");
      onSuccess?.(data.user); // pass user up to LoginPage
    } catch (error) {
      alert(error?.response?.data?.message || "Login failed");
      try {
        recaptchaRef.current?.reset();
      } catch {
        // ignore
      }
      setCaptcha("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {/* Email */}
      <div>
        <label>Email</label>
        <div className="input-box has-icon">
          <span className="input-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M1.5 7.5v9A1.5 1.5 0 0 0 3 18h18a1.5 1.5 0 0 0 1.5-1.5v-9L12 12 1.5 7.5z" />
              <path d="M22.5 6V5.5A1.5 1.5 0 0 0 21 4H3A1.5 1.5 0 0 0 1.5 5.5V6L12 10.5 22.5 6z" />
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
          <span className="input-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5h-9z" />
              <path d="M5 10.5A1.5 1.5 0 0 0 3.5 12v7A1.5 1.5 0 0 0 5 20.5h14A1.5 1.5 0 0 0 20.5 19v-7A1.5 1.5 0 0 0 19 10.5H5z" />
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

      {/* Forgot Password */}
      <p className="text-right">
        <button
          type="button"
          onClick={onForgot}
          style={{ background: "none", color: "#1e40af" }}
        >
          Forgot Password?
        </button>
      </p>

      {/* reCAPTCHA */}
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        onChange={(val) => setCaptcha(val || "")}
        onExpired={() => setCaptcha("")}
        onErrored={() => setCaptcha("")}
      />

      {/* Login Button */}
      <button
        className="btn-primary"
        type="submit"
        disabled={loading || !captcha}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="google-btn"
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google logo"
          className="google-logo"
        />
        <span>Continue with Google</span>
      </button>

      {/* Switch to Register */}
      <p className="text-center">
        Don’t have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{ background: "none", color: "#1e40af" }}
        >
          Register
        </button>
      </p>
    </form>
  );
}
