// src/Teacher/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import "./teacher.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Sidebar({ onLogout, onNavigate }) {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    let abort = false;

    async function fetchMe() {
      try {
        setLoadingMe(true);
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const user = data?.user || data;
        if (!abort) setMe(user);
      } catch (err) {
        console.error("[TEACHER][SIDEBAR][ME][ERROR]", err);
      } finally {
        if (!abort) setLoadingMe(false);
      }
    }

    fetchMe();

    function handleProfileUpdated(e) {
      const updatedUser = e.detail?.user;
      if (updatedUser) {
        setMe((prev) => ({
          ...(prev || {}),
          ...updatedUser,
        }));
      }
    }

    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      abort = true;
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, []);

  const handleLogout = () => {
    // call the parent logout handler if provided
    if (onLogout) {
      onLogout();
      return;
    }

    // fallback: direct API call + hard redirect
    fetch(`${API}/api/auth/logoutUser`, {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      window.location.href = "/login"; // or "/" for landing
    });
  };

  const handleNavClick = (path) => {
    if (onNavigate) onNavigate(path);
  };

  return (
    <aside className="admin-sidebar">
      <div className="brand">
        <span className="dot" /> Teacher Panel
      </div>

      {/* user block removed */}

      <nav className="nav">
        <NavLink
          to="/teacher"
          end
          className={({ isActive }) => (isActive ? "active" : undefined)}
          onClick={() => handleNavClick("dashboard")}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/teacher/thesis"
          className={({ isActive }) => (isActive ? "active" : undefined)}
          onClick={() => handleNavClick("thesis")}
        >
          Capstone
        </NavLink>

        <NavLink
          to="/teacher/activity"
          className={({ isActive }) => (isActive ? "active" : undefined)}
          onClick={() => handleNavClick("activity")}
        >
          Activity
        </NavLink>

        <NavLink
          to="/teacher/profile"
          className={({ isActive }) =>
            isActive ? "active profile-link" : "profile-link"
          }
          onClick={() => handleNavClick("profile")}
        >
          Profile
        </NavLink>
      </nav>

      <div className="sidebar-spacer" />

      <button className="logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}
