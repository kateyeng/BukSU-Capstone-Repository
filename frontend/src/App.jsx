// src/App.jsx
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import api from "./api/axios.js";

/* ===== Public (guest, no login) ===== */
import PublicDashboard from "./Public/Dashboard.jsx";
import PublicBrowse from "./Public/Browse.jsx";
import PublicDetails from "./Public/Details.jsx";
import PublicAbout from "./Public/About.jsx";
import PublicContact from "./Public/Contact.jsx";

/* ===== Auth ===== */
import LoginForm from "./Login/LoginForm.jsx";
import SignUpForm from "./Login/SignUpForm.jsx";
import ForgotPassword from "./Login/ForgotPassword.jsx";
import Code from "./Login/Code.jsx";
import ResetPassword from "./Login/ResetPassword.jsx";

/* ===== Student (login required) ===== */
import StudentDashboard from "./student/Dashboard.jsx";
import StudentBrowse from "./student/Browse.jsx";
import StudentDetails from "./student/Details.jsx";
import StudentAbout from "./student/About.jsx";
import StudentContact from "./student/Contact.jsx";
import StudentProfile from "./student/Profile.jsx";
import StudentUploads from "./student/Uploads.jsx";
import StudentBookmarks from "./student/Bookmarks.jsx";

/* ===== Teacher (login required) ===== */
import TeacherDashboard from "./teacher/Dashboard.jsx";
import TeacherThesis from "./teacher/Thesis.jsx";
import TeacherUsers from "./teacher/Users.jsx";

/* ===== Admin (login required) ===== */
import AdminLayout from "./Admin/adminLayout.jsx";
import AdminDashboard from "./Admin/adminDashboard.jsx";
import AdminUsers from "./Admin/adminUsers.jsx";

/* =================== OAUTH NOTICE =================== */
function UseOauthNotice() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const source = p.get("source");
    const role = (p.get("role") || "").toLowerCase();
    const notice = p.get("notice");
    const isNew = p.get("isNew");

    if (source === "google") {
      const isGuest = role === "guest";
      const shouldVerify = isGuest || notice === "verify";

      if (shouldVerify) {
        alert(
          "Your account is being verified. Please wait and try again later!"
        );
        console.log(
          "[OAuth] Login (pending verification). isNew:",
          isNew,
          "role:",
          role
        );
      } else {
        alert("Logged in successfully");
        console.log("[OAuth] Google login success role:", role);
      }

      // Clean query params
      p.delete("source");
      p.delete("role");
      p.delete("notice");
      p.delete("isNew");
      navigate(
        { pathname: location.pathname, search: p.toString() },
        { replace: true }
      );
    }
  }, [location, navigate]);

  return null;
}

/* =================== HELPERS =================== */
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Normalize roles and force unknown values to "guest"
const normRole = (v) => {
  const r = String(v || "").trim().toLowerCase();
  if (["student", "teacher", "admin"].includes(r)) return r;
  return "guest";
};

// 🔐 Guard for private routes
// - not logged in     -> /login
// - wrong role        -> /  (public)
function RequireRole({ user, roles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

/* ---------- PUBLIC (guest) wrappers ---------- */
function PublicHomePage() {
  const nav = useNavigate();
  return (
    <PublicDashboard
      onNavigate={(dest, id) => {
        if (dest === "dashboard") nav("/");
        else if (dest === "browse") nav("/browse");
        else if (dest === "about") nav("/about");
        else if (dest === "contact") nav("/contact");
        else if (dest === "details") nav(`/details/${id}`);
      }}
      onLogin={() => nav("/login")}
    />
  );
}

function PublicBrowsePage() {
  const nav = useNavigate();
  return (
    <PublicBrowse
      onNavigate={(dest, id) => {
        if (dest === "dashboard") nav("/");
        else if (dest === "browse") nav("/browse");
        else if (dest === "about") nav("/about");
        else if (dest === "contact") nav("/contact");
        else if (dest === "details") nav(`/details/${id}`);
      }}
      onLogin={() => nav("/login")}
    />
  );
}

function PublicDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  return (
    <PublicDetails
      id={id}
      onNavigate={(dest) => {
        if (dest === "dashboard") nav("/");
        else if (dest === "browse") nav("/browse");
        else if (dest === "about") nav("/about");
        else if (dest === "contact") nav("/contact");
        else if (dest === "login") nav("/login");
      }}
    />
  );
}

/* ---------- STUDENT wrappers ---------- */
function mapStudentNav(nav, dest, id) {
  if (dest === "dashboard") nav("/student");
  else if (dest === "browse") nav("/student/browse");
  else if (dest === "upload") nav("/student/uploads");
  else if (dest === "about") nav("/student/about");
  else if (dest === "contact") nav("/student/contact");
  else if (dest === "profile") nav("/student/profile");
  else if (dest === "bookmarks") nav("/student/bookmarks");
  else if (dest === "details") nav(`/student/details/${id}`);
}

function StudentHome({ onLogout }) {
  const nav = useNavigate();
  return (
    <StudentDashboard
      onLogout={onLogout}
      onNavigate={(dest, id) => mapStudentNav(nav, dest, id)}
    />
  );
}

function StudentBrowsePage({ onLogout }) {
  const nav = useNavigate();
  return (
    <StudentBrowse
      onLogout={onLogout}
      onNavigate={(dest, id) => mapStudentNav(nav, dest, id)}
    />
  );
}

function StudentUploadsPage({ onLogout }) {
  const nav = useNavigate();
  return (
    <StudentUploads
      onLogout={onLogout}
      onNavigate={(dest, id) => mapStudentNav(nav, dest, id)}
    />
  );
}

function StudentDetailsPage({ onLogout }) {
  const { id } = useParams();
  const nav = useNavigate();
  return (
    <StudentDetails
      id={id}
      onLogout={onLogout}
      onNavigate={(dest) => mapStudentNav(nav, dest)}
    />
  );
}

function StudentAboutPage({ onLogout }) {
  const nav = useNavigate();
  return (
    <StudentAbout
      onLogout={onLogout}
      onNavigate={(dest, id) => mapStudentNav(nav, dest, id)}
    />
  );
}

function StudentContactPage({ onLogout }) {
  const nav = useNavigate();
  return (
    <StudentContact
      onLogout={onLogout}
      onNavigate={(dest, id) => mapStudentNav(nav, dest, id)}
    />
  );
}

function StudentProfilePage({ onLogout }) {
  const nav = useNavigate();
  return (
    <StudentProfile
      onLogout={onLogout}
      onNavigate={(dest, id) => mapStudentNav(nav, dest, id)}
    />
  );
}

function StudentBookmarksPage({ onLogout }) {
  const nav = useNavigate();
  return (
    <StudentBookmarks
      onLogout={onLogout}
      onNavigate={(dest, id) => mapStudentNav(nav, dest, id)}
    />
  );
}

/* ---------- TEACHER wrappers ---------- */
function TeacherHome({ onLogout }) {
  const nav = useNavigate();
  return (
    <TeacherDashboard
      onLogout={onLogout}
      onNavigate={(dest) => {
        if (dest === "dashboard") nav("/teacher");
        else if (dest === "thesis") nav("/teacher/thesis");
        else if (dest === "users") nav("/teacher/users");
      }}
    />
  );
}

function TeacherThesisPage({ onLogout }) {
  return <TeacherThesis onLogout={onLogout} />;
}

function TeacherUsersPage({ onLogout }) {
  return <TeacherUsers onLogout={onLogout} />;
}

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

        // Redirect based on role
        queueMicrotask(() => {
          if (role === "admin") nav("/admin", { replace: true });
          else if (role === "teacher") nav("/teacher", { replace: true });
          else if (role === "student") nav("/student", { replace: true });
          else nav("/", { replace: true }); // guest/unknown -> public
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
  return (
    <Code
      email={email}
      onBack={() => nav("/forgot")}
      onVerified={() => nav("/reset")}
    />
  );
}

function ResetPage({ email }) {
  const nav = useNavigate();
  return (
    <ResetPassword
      email={email}
      onBack={() => nav("/code")}
      onResetDone={() => nav("/login")}
    />
  );
}

/* =================== APP =================== */
export default function App() {
  const [user, setUser] = useState(null); // null = guest
  const [loading, setLoading] = useState(true);
  const [emailForReset, setEmailForReset] = useState("");

  const nav = useNavigate();

  // Check existing session
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await api.get("/api/auth/me", { withCredentials: true });
        const data = res.data;
        const u = data?.user || data;
        if (alive && u && u._id) {
          const role = normRole(u.role);
          setUser({ ...u, role });
        }
      } catch (err) {
        if (err?.response?.status !== 401) {
          console.error("auth/me failed:", err);
        }
        if (alive) setUser(null); // guest
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
      } else {
        const err = await res.json().catch(() => null);
        alert(
          err?.message ||
          "Logout failed on server, but you have been signed out locally."
        );
      }
    } catch (e) {
      alert("Network issue — logged out locally.");
    } finally {
      setUser(null); // back to guest
      nav("/", { replace: true }); // public home
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
      <UseOauthNotice />

      <Routes>
        {/* ===== PUBLIC (guest) ===== */}
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/dashboard" element={<PublicHomePage />} /> {/* alias */}
        <Route path="/browse" element={<PublicBrowsePage />} />
        <Route path="/details/:id" element={<PublicDetailsPage />} />
        <Route path="/about" element={<PublicAbout />} />
        <Route path="/contact" element={<PublicContact />} />

        {/* ===== AUTH ===== */}
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/forgot"
          element={<ForgotPage setEmail={setEmailForReset} />}
        />
        <Route path="/code" element={<CodePage email={emailForReset} />} />
        <Route path="/reset" element={<ResetPage email={emailForReset} />} />

        {/* ===== STUDENT (requires role=student) ===== */}
        <Route
          path="/student"
          element={
            <RequireRole user={user} roles={["student"]}>
              <StudentHome onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/student/browse"
          element={
            <RequireRole user={user} roles={["student"]}>
              <StudentBrowsePage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/student/uploads"
          element={
            <RequireRole user={user} roles={["student"]}>
              <StudentUploadsPage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/student/details/:id"
          element={
            <RequireRole user={user} roles={["student"]}>
              <StudentDetailsPage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/student/about"
          element={
            <RequireRole user={user} roles={["student"]}>
              <StudentAboutPage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/student/contact"
          element={
            <RequireRole user={user} roles={["student"]}>
              <StudentContactPage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/student/profile"
          element={
            <RequireRole user={user} roles={["student"]}>
              <StudentProfilePage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/student/bookmarks"
          element={
            <RequireRole user={user} roles={["student"]}>
              <StudentBookmarksPage onLogout={logout} />
            </RequireRole>
          }
        />

        {/* ===== TEACHER (requires role=teacher) ===== */}
        <Route
          path="/teacher"
          element={
            <RequireRole user={user} roles={["teacher"]}>
              <TeacherHome onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/thesis"
          element={
            <RequireRole user={user} roles={["teacher"]}>
              <TeacherThesisPage onLogout={logout} />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/users"
          element={
            <RequireRole user={user} roles={["teacher"]}>
              <TeacherUsersPage onLogout={logout} />
            </RequireRole>
          }
        />

        {/* ===== ADMIN (requires role=admin) ===== */}
        <Route
          path="/admin"
          element={
            <RequireRole user={user} roles={["admin"]}>
              <AdminLayout currentUser={user} onLogout={logout} />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Fallback → public home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
