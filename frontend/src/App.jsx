// src/App.jsx
import { useEffect, useState } from "react";
import LoginForm from "./Login/LoginForm";
import SignUpForm from "./Login/SignUpForm";
import ForgotPassword from "./Login/ForgotPassword";
import Code from "./Login/Code";
import ResetPassword from "./Login/ResetPassword";

import Dashboard from "./Teacher/Dashboard";
import Browse from "./Teacher/Browse";
import Upload from "./Teacher/Upload";

import "./index.css";

export default function App() {
  const [view, setView] = useState("login");
  const [emailForReset, setEmailForReset] = useState("");

  // Apply dashboard layout styles to dashboard-like pages
  useEffect(() => {
    const isDashLike = view === "dashboard" || view === "browse" || view === "upload";
    document.body.classList.toggle("dashboard-mode", isDashLike);
    return () => document.body.classList.remove("dashboard-mode");
  }, [view]);

  // ---- In-app "routes" (no router library) ----
  if (view === "dashboard") {
    return (
      <Dashboard
        onLogout={() => setView("login")}
        onNavigate={(dest) => setView(dest)}   // "dashboard" | "browse" | "upload"
      />
    );
  }

  if (view === "browse") {
    return (
      <Browse
        onBack={() => setView("dashboard")}
        onNavigate={(dest) => setView(dest)}
      />
    );
  }

  if (view === "upload") {
    return (
      <Upload
        onBack={() => setView("dashboard")}
        onNavigate={(dest) => setView(dest)}
      />
    );
  }

  // ---- Auth screens ----
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
