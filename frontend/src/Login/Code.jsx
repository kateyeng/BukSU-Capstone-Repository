import { useState } from "react";

export default function Code({ email, onBack, onVerified }) {
  const [code, setCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim().length < 6) {
      alert("Please enter the 6-digit code.");
      return;
    }
    // TODO: verify code via backend
    onVerified(code);
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

      <button className="btn-primary" type="submit">
        Verify Code
      </button>

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
