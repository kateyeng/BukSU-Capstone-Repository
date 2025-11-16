import { useState } from "react";
import axios from "axios";

export default function Code({ email, onBack, onVerified }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.trim().length < 6) {
      alert("Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // ✅ Verify the code through backend
      const response = await axios.post("http://localhost:3000/api/auth/verifyCode", {
        email,
        code,
      });

      setMessage(response.data.message || "Code verified successfully!");
      localStorage.setItem("resetCode", code);
      onVerified(code); // Pass verified code back to App.jsx
    } catch (error) {
      console.error("❌ Code verification failed:", error);
      setMessage(error.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div style={{ marginBottom: "10px" }}>
        <button type="button" className="link" onClick={onBack}>
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
          onClick={() => alert("Resent!")}
        >
          Resend
        </button>
      </p>
    </form>
  );
}
