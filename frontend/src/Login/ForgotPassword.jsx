import { useState } from "react";

export default function ForgotPassword({ onBack, onEmailSubmitted }) {
  const [email, setEmail] = useState("");

  const submit = (e) => {
    e.preventDefault();
    // TODO: call your API to send reset code to the email
    // await api.sendResetCode(email)
    onEmailSubmitted(email);
  };

  return (
    <form className="form" onSubmit={submit}>
<div style={{ marginBottom: "10px" }}>
  <button type="button" className="link" onClick={onBack}>
    ← Back to Login
  </button>
</div>


      <div>
        <label>Enter your email</label>
        <div className="input-box has-icon">
          <span className="input-icon">
            {/* mail icon */}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M1.5 7.5v9A1.5 1.5 0 0 0 3 18h18a1.5 1.5 0 0 0 1.5-1.5v-9L12 12 1.5 7.5z"/>
              <path d="M22.5 6V5.5A1.5 1.5 0 0 0 21 4H3A1.5 1.5 0 0 0 1.5 5.5V6L12 10.5 22.5 6z"/>
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

      <button className="btn-primary" type="submit">Send Code</button>

      <p className="text-center">
        We’ll email a 6-digit code to reset your password.
      </p>
    </form>
  );
}
