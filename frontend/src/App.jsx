import { useEffect, useState } from "react";
import api from "./api/axios.js";

import LoginForm from "./Login/LoginForm";
import SignUpForm from "./Login/SignUpForm";
import ForgotPassword from "./Login/ForgotPassword";
import Code from "./Login/Code";
import ResetPassword from "./Login/ResetPassword";

import "./index.css";
import Dashboard from "./teacher/Dashboard";
import Browse from "./teacher/Browse";
import Upload from "./teacher/Upload";

export default function App() {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [code, setCode] = useState("");
  const [user, setUser] = useState(null);

  //  Hydrate session on load
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data.user);
        if (data.user.role === "teacher" || data.user.role === "admin") {
          setView("dashboard");
        } else {
          setView("login"); // students stay on login or public browse
        }
      } catch (error) {
         setUser(null);
      }
      
    })();
  }, []);

  //  Handle successful login
  const handleLoginSuccess = (u) => {
    setUser(u);
    if (u.role === "teacher" || u.role === "admin") {
      setView("dashboard");
    } else {
      // Students shouldn't access teacher dashboard
      alert("Student accounts do not have dashboard access.");
      setView("login");
    }
  };

  // Toggle body styles when dashboard active
  useEffect(() => {
    document.body.classList.toggle("dashboard-mode", view === "dashboard");
    return () => document.body.classList.remove("dashboard-mode");
  }, [view]);

  //  Teacher/Admin Dashboard
  if (view === "dashboard") {
    return (
      <Dashboard
        onLogout={async () => {
          await api.post("/api/auth/logoutUser");
          console.log("Successfully logout!");
          setUser(null);
          setView("login");
        }}
        onNavigate={(next) => setView(next)}
      />
    );
  }

  //  Login & Auth pages
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

        {/*  LOGIN */}
        {view === "login" && (
          <LoginForm
            onSwitch={() => setView("signup")}
            onForgot={() => setView("forgot")}
            onSuccess={handleLoginSuccess}
          />
        )}

        {/* SIGNUP */}
        {view === "signup" && <SignUpForm onSwitch={() => setView("login")} />}

        {/* FORGOT PASSWORD */}
        {view === "forgot" && (
          <ForgotPassword
            onBack={() => setView("login")}
            onEmailSubmitted={(email, resetToken) => {
              setEmail(email);
              setResetToken(resetToken);
              setView("code");
            }}
          />
        )}

        {/* VERIFY CODE */}
        {view === "code" && (
          <Code
            email={email}
            onBack={() => setView("forgot")}
            onVerified={(enteredCode) => {
              setCode(enteredCode);
              setView("reset");
            }}
          />
        )}

        {/* RESET PASSWORD */}
        {view === "reset" && (
          <ResetPassword
            email={email}
            resetToken={resetToken}
            code={code}
            onBack={() => setView("code")}
            onResetDone={() => setView("login")}
          />
        )}
      </div>
    </div>
  );
}
