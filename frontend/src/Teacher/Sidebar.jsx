// src/Teacher/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import "./teacher.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="admin-sidebar">
      <div className="brand">
        <span className="dot" /> Teacher Panel
      </div>

      <nav className="nav">
        <NavLink
          to="/teacher"
          end
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/teacher/thesis"
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          Thesis
        </NavLink>

        <NavLink
          to="/teacher/activity"
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          Activity
        </NavLink>
      </nav>

      <div className="sidebar-spacer" />

      <button
        className="logout"
        onClick={() =>
          fetch(`${API}/api/auth/logoutUser`, {
            method: "POST",
            credentials: "include",
          }).finally(() => navigate("/login", { replace: true }))
        }
      >
        Logout
      </button>
    </aside>
  );
}
