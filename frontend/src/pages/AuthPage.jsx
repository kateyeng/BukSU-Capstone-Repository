import { useState } from "react";
import LoginForm from "../components/LoginForm";
import ForgotPassword from "../components/ForgotPassword";
import ResetPassword from "../components/ResetPassword";

export default function AuthPage() {
  const [step, setStep] = useState("login"); // login | forgot | reset
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Handle navigation and data flow between forms
  const handleForgotPassword = () => setStep("forgot");

  const handleCodeSent = (userEmail, token) => {
    setEmail(userEmail);
    setResetToken(token);
    setStep("reset");
  };

  const handleResetDone = () => {
    setStep("login");
    setEmail("");
    setResetToken("");
  };

  return (
    <div className="auth-container">
      {step === "login" && (
        <LoginForm onForgot={handleForgotPassword} />
      )}

      {step === "forgot" && (
        <ForgotPassword
          onBack={() => setStep("login")}
          onCodeSent={handleCodeSent}
        />
      )}

      {step === "reset" && (
        <ResetPassword
          email={email}
          resetToken={resetToken}
          onBack={() => setStep("forgot")}
          onResetDone={handleResetDone}
        />
      )}
    </div>
  );
}
