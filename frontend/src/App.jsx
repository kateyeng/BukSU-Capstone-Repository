import { useEffect, useState } from "react";
import LoginForm from "./Login/LoginForm";
import SignUpForm from "./Login/SignUpForm";
import ForgotPassword from "./Login/ForgotPassword";
import Code from "./Login/Code";
import ResetPassword from "./Login/ResetPassword";
import Dashboard from "./Admin/Dashboard";
import "./index.css";

export default function App() {
  const [view, setView] = useState("login");
  const [emailForReset, setEmailForReset] = useState("");

  // When entering/leaving dashboard, toggle a class on <body>
  useEffect(() => {
    document.body.classList.toggle("dashboard-mode", view === "dashboard");
    return () => document.body.classList.remove("dashboard-mode");
  }, [view]);

  // Render the dashboard WITHOUT the narrow wrapper
  if (view === "dashboard") {
    return <Dashboard onLogout={() => setView("login")} />;
  }

  // Auth screens (centered/narrow)
  return (
    <div style={{ width: "100%", maxWidth: 540, margin: "0 auto" }}>
      <div className="header">
        <h1>BukSU CoT Capstone Repository</h1>
        <p>Access your academic research portal</p>
      </div>

      <div className="container">
        <div className="tabs">
          <div
            className={`tab ${view === "login" ? "active" : ""}`}
            onClick={() => setView("login")}
          >
            Login
          </div>
          <div
            className={`tab ${view === "signup" ? "active" : ""}`}
            onClick={() => setView("signup")}
          >
            Sign Up
          </div>
        </div>

        {view === "login" && (
          <LoginForm
            onSwitch={() => setView("signup")}
            onForgot={() => setView("forgot")}
            onSuccess={() => setView("dashboard")}
          />
        )}

        {view === "signup" && <SignUpForm onSwitch={() => setView("login")} />}

        {view === "forgot" && (
          <ForgotPassword
            onBack={() => setView("login")}
            onEmailSubmitted={(email) => {
              setEmailForReset(email);
              setView("code");
            }}
          />
        )}

        {view === "code" && (
          <Code
            email={emailForReset}
            onBack={() => setView("forgot")}
            onVerified={() => setView("reset")}
          />
        )}

        {view === "reset" && (
          <ResetPassword
            email={emailForReset}
            onBack={() => setView("code")}
            onResetDone={() => setView("login")}
          />
        )}
      </div>
    </div>
  );
}
