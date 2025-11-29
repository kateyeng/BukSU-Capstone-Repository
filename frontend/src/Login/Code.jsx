import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axios.js";
import toast from "react-hot-toast";

export default function Code({ email: emailProp, onBack, onVerified }) {
  const navigate = useNavigate();
  const location = useLocation();

  // allow getting email from props, location.state, or localStorage
  const emailFromState = location.state?.email;
  const emailFromStorage = localStorage.getItem("resetEmail") || "";
  const email = emailProp || emailFromState || emailFromStorage;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.trim().length < 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const verifyPromise = axios.post("/api/auth/verifyCode", {
        email,
        code,
      });

      const response = await toast.promise(
        verifyPromise,
        {
          loading: "Verifying code...",
          success: (res) =>
            res.data?.message || "Code verified successfully!",
          error: (err) =>
            err?.response?.data?.message || "Invalid or expired code.",
        },
        { duration: 3000 }
      );

      setMessage(response.data?.message || "Code verified successfully!");

      // keep code for reset step
      localStorage.setItem("resetCode", code);

      // notify parent
      onVerified?.(code);

      // default navigation if parent not handling it
      if (!onVerified) {
        navigate("/reset");
      }
    } catch (error) {
      console.error("❌ Code verification failed:", error);
      setMessage(
        error?.response?.data?.message || "Invalid or expired code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    // You can replace this with a real resend endpoint later
    toast.success("If this were connected, the code would be resent.");
  };

  return (
    <div className="auth-page">
      {/* Header */}
      <header className="header">
        <h1>BukSU CoT Thesis Realm</h1>
        <p>Verify your reset code</p>
      </header>

      {/* Card */}
      <div className="container">
        <div className="tabs">
          <button className="tab active" type="button">
            Verify Code
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <button type="button" className="link" onClick={handleBack}>
              ← Back to Login
            </button>
          </div>

          <div style={{ marginBottom: 6, color: "#555", fontSize: 14 }}>
            Enter the 6-digit code sent to <b>{email}</b>
          </div>

          <div className="single-otp-box">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter your code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              required
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>

          {message && (
            <p className="text-center" style={{ marginTop: 10 }}>
              {message}
            </p>
          )}

          <p className="text-center">
            Didn’t get it?{" "}
            <button
              type="button"
              className="link"
              onClick={handleResend}
            >
              Resend
            </button>
          </p>
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
