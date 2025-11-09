// src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import api from "./api/axios.js";

/* ===== Students (public) ===== */
import StudentDashboard from "./Students/Dashboard.jsx";
import StudentBrowse from "./Students/Browse.jsx";
import StudentDetails from "./Students/Details.jsx";
import StudentAbout from "./Students/About.jsx";
import { Contact as StudentContact } from "./Students/Contact.jsx";

/* ===== Auth ===== */
import LoginForm from "./Login/LoginForm.jsx";
import SignUpForm from "./Login/SignUpForm.jsx";
import ForgotPassword from "./Login/ForgotPassword.jsx";
import Code from "./Login/Code.jsx";
import ResetPassword from "./Login/ResetPassword.jsx";

/* ===== Teacher ===== */
import TeacherDashboard from "./teacher/Dashboard.jsx";
import TeacherBrowse from "./teacher/Browse.jsx";
import TeacherUpload from "./teacher/Uploads.jsx";
import TeacherDetails from "./teacher/Details.jsx";
import TeacherAbout from "./teacher/About.jsx";
import TeacherContact from "./teacher/Contact.jsx";

/* ===== Admin ===== */
import AdminDashboard from "./Admin/Dashboard.jsx";
import AdminUsers from "./Admin/Users.jsx";
import AdminThesis from "./Admin/Thesis.jsx";

/* =================== OAUTH NOTICE (NEW) =================== */
function UseOauthNotice() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const source = p.get("source");
    const role   = (p.get("role") || "").toLowerCase(); // primary flag
    const notice = p.get("notice");                      // fallback
    const isNew  = p.get("isNew");

    if (source === "google") {
      const isStudent = role === "student";
      const shouldVerify = isStudent || notice === "verify";

      if (shouldVerify) {
        alert("Your account is being verified. Please wait and try again later!");
        console.log("[OAuth] Student login (pending verification).");
      } else {
        alert("Logged in successfully");
        console.log("Successfully login");
      }

      // Clean URL so it won’t re-trigger on refresh
      p.delete("source");
      p.delete("role");
      p.delete("notice");
      p.delete("isNew");
      navigate({ pathname: location.pathname, search: p.toString() }, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

/* =================== HELPERS =================== */
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const normRole = (v) => String(v || "").trim().toLowerCase();

function RequireRole({ user, roles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/students" replace />;
  return children;
}

/* ---------- Student wrappers ---------- */
function HomePage() {
  const nav = useNavigate();
  return (
    <StudentDashboard
      onNavigate={(dest, id) => {
        if (dest === "dashboard") nav("/students");
        else if (dest === "browse") nav("/browse");
        else if (dest === "about") nav("/about");
        else if (dest === "contact") nav("/contact");
        else if (dest === "details") nav(`/details/${id}`);
        else if (dest === "upload") nav("/upload");
      }}
      onLogin={() => nav("/login")}
    />
  );
}
function BrowsePage() {
  const nav = useNavigate();
  return (
    <StudentBrowse
      onNavigate={(dest, id) => {
        if (dest === "dashboard") nav("/students");
        else if (dest === "browse") nav("/browse");
        else if (dest === "about") nav("/about");
        else if (dest === "contact") nav("/contact");
        else if (dest === "details") nav(`/details/${id}`);
        else if (dest === "upload") nav("/upload");
      }}
    />
  );
}
function DetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  return (
    <StudentDetails
      id={id}
      onNavigate={(dest) => {
        if (dest === "dashboard") nav("/students");
        else if (dest === "browse") nav("/browse");
        else if (dest === "about") nav("/about");
        else if (dest === "contact") nav("/contact");
      }}
    />
  );
}

/* ---------- Teacher wrappers (ALL accept onLogout) ---------- */
function TeacherHome({ onLogout }) {
  const nav = useNavigate();
  return (
    <TeacherDashboard
      onLogout={onLogout}
      onNavigate={(dest, id) => {
        if (dest === "dashboard") nav("/teacher");
        else if (dest === "browse") nav("/teacher/browse");
        else if (dest === "upload") nav("/teacher/upload");
        else if (dest === "about") nav("/teacher/about");
        else if (dest === "contact") nav("/teacher/contact");
        else if (dest === "details") nav(`/teacher/details/${id}`);
      }}
    />
  );
}
function TeacherBrowsePage({ onLogout }) {
  const nav = useNavigate();
  return (
    <TeacherBrowse
      onLogout={onLogout}
      onNavigate={(dest, id) => {
        if (dest === "dashboard") nav("/teacher");
        else if (dest === "browse") nav("/teacher/browse");
        else if (dest === "upload") nav("/teacher/upload");
        else if (dest === "about") nav("/teacher/about");
        else if (dest === "contact") nav("/teacher/contact");
        else if (dest === "details") nav(`/teacher/details/${id}`);
      }}
    />
  );
}
function TeacherUploadPage({ onLogout }) {
  const nav = useNavigate();
  return (
    <TeacherUpload
      onLogout={onLogout}
      onNavigate={(dest) => {
        if (dest === "dashboard") nav("/teacher");
        else if (dest === "browse") nav("/teacher/browse");
        else if (dest === "about") nav("/teacher/about");
        else if (dest === "contact") nav("/teacher/contact");
      }}
    />
  );
}
function TeacherDetailsPage({ onLogout }) {
  const { id } = useParams();
  const nav = useNavigate();
  return (
    <TeacherDetails
      id={id}
      onLogout={onLogout}
      onNavigate={(dest) => {
        if (dest === "dashboard") nav("/teacher");
        else if (dest === "browse") nav("/teacher/browse");
        else if (dest === "upload") nav("/teacher/upload");
        else if (dest === "about") nav("/teacher/about");
        else if (dest === "contact") nav("/teacher/contact");
      }}
    />
  );
}

/* ---------- Admin wrappers ---------- */
function AdminHome({ onLogout }) {
  const nav = useNavigate();
  return (
    <AdminDashboard
      onLogout={onLogout}
      onNavigate={(dest) => {
        if (dest === "dashboard") nav("/admin");
        else if (dest === "users") nav("/admin/users");
        else if (dest === "thesis") nav("/admin/thesis");
      }}
    />
  );
}
const AdminUsersPage = () => <AdminUsers />;
const AdminThesisPage = () => <AdminThesis />;

/* ---------- Auth wrappers ---------- */
function LoginPage({ setUser }) {
  const nav = useNavigate();
  return (
    <LoginForm
      onSwitch={() => nav("/signup")}
      onForgot={() => nav("/forgot")}
      onSuccess={(userFromApi) => {
        const role = normRole(userFromApi?.role);
        const userSafe = { ...userFromApi, role };
        setUser(userSafe);
        queueMicrotask(() => {
          if (role === "admin") nav("/admin", { replace: true });
          else if (role === "teacher") nav("/teacher", { replace: true });
          else nav("/students", { replace: true });
        });
      }}
    />
  );
}
const SignUpPage = () => <SignUpForm onSwitch={() => history.back()} />;
function ForgotPage({ setEmail }) {
  const nav = useNavigate();
  return (
    <ForgotPassword
      onBack={() => nav("/login")}
      onEmailSubmitted={(email) => {
        setEmail(email);
        nav("/code");
      }}
    />
  );
}
function CodePage({ email }) {
  const nav = useNavigate();
  return <Code email={email} onBack={() => nav("/forgot")} onVerified={() => nav("/reset")} />;
}
function ResetPage({ email }) {
  const nav = useNavigate();
  return <ResetPassword email={email} onBack={() => nav("/code")} onResetDone={() => nav("/login")} />;
}

/* =================== APP =================== */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailForReset, setEmailForReset] = useState("");

  const nav = useNavigate(); // for logout redirect

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await api.get("/api/auth/me"); // sends cookie automatically
        const data = res.data;
        if (alive && data?.user) {
          const role = normRole(data.user.role);
          setUser({ ...data.user, role });
        }
      } catch (err) {
        if (err?.response?.status !== 401) {
          console.error("auth/me failed:", err);
        }
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    try {
      const res = await fetch(`${API}/api/auth/logoutUser`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.message || "Logout successfully");
        console.log("Logout successfully", data);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Logout failed on server, but you have been signed out locally.");
      }
    } catch (e) {
      alert("Network issue — logged out locally.");
    } finally {
      setUser(null);
      nav("/students", { replace: true });
    }
  };

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* NEW: listens for ?source=google&role=... (and notice fallback) and shows alerts */}
      <UseOauthNotice />

      <Routes>
        {/* Root -> Students */}
        <Route path="/" element={<Navigate to="/students" replace />} />

        {/* ===== Student (public) ===== */}
        <Route path="/students" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/details/:id" element={<DetailsPage />} />
        <Route path="/about" element={<StudentAbout />} />
        <Route path="/contact" element={<StudentContact />} />

        {/* Upload link (public route) -> allows only teacher/admin */}
        <Route
          path="/upload"
          element={
            user ? (
              ["teacher", "admin"].includes(user.role) ? (
                <TeacherUploadPage onLogout={logout} />
              ) : (
                <Navigate to="/login" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ===== Auth ===== */}
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot" element={<ForgotPage setEmail={setEmailForReset} />} />
        <Route path="/code" element={<CodePage email={emailForReset} />} />
        <Route path="/reset" element={<ResetPage email={emailForReset} />} />

        {/* ===== Teacher/Admin (protected) ===== */}
        <Route
          path="/teacher"
          element={
            <RequireRole user={user} roles={["teacher", "admin"]}>
              <TeacherHome onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/browse"
          element={
            <RequireRole user={user} roles={["teacher", "admin"]}>
              <TeacherBrowsePage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/upload"
          element={
            <RequireRole user={user} roles={["teacher", "admin"]}>
              <TeacherUploadPage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/details/:id"
          element={
            <RequireRole user={user} roles={["teacher", "admin"]}>
              <TeacherDetailsPage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/about"
          element={
            <RequireRole user={user} roles={["teacher", "admin"]}>
              <TeacherAbout onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/contact"
          element={
            <RequireRole user={user} roles={["teacher", "admin"]}>
              <TeacherContact onLogout={logout} />
            </RequireRole>
          }
        />

        {/* ===== Admin (admin-only) ===== */}
        <Route
          path="/admin"
          element={
            <RequireRole user={user} roles={["admin"]}>
              <AdminHome onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole user={user} roles={["admin"]}>
              <AdminUsersPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/thesis"
          element={
            <RequireRole user={user} roles={["admin"]}>
              <AdminThesisPage />
            </RequireRole>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/students" replace />} />
      </Routes>
    </>
  );
}
