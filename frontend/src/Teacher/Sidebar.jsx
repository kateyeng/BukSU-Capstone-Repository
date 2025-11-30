// src/Teacher/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./teacher.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // Load current teacher/admin
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

    // listen for profile update events from Profile page
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

  const displayName =
    (me && (me.name || me.fullName || me.email)) || "Teacher";
  const roleLabel = (me && (me.role || "teacher")) || "teacher";
  const avatarUrl =
    me?.avatarUrl || me?.picture || me?.photo || me?.googlePhotoUrl || null;

  return (
    <aside className="admin-sidebar">
      <div className="brand">
        <span className="dot" /> Teacher Panel
      </div>

      {/* User block (binds to profile changes) */}
      <div className="sidebar-user">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="sidebar-user__avatar" />
        ) : (
          <div className="sidebar-user__avatar sidebar-user__avatar--fallback">
            {loadingMe ? "…" : getInitials(displayName)}
          </div>
        )}

        <div className="sidebar-user__info">
          <div className="sidebar-user__name">
            {loadingMe ? "Loading…" : displayName}
          </div>
          <div className="sidebar-user__role">
            {roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)}
          </div>
        </div>
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

        <NavLink
          to="/teacher/profile"
          className={({ isActive }) =>
            isActive ? "active profile-link" : "profile-link"
          }
        >
          Profile
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
