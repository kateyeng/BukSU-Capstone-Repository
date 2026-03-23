import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../index.css";
import usePermissions from "../hooks/usePermissions";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function StudentNavbar({
  current = null,
  onNavigate = () => {},
  user: userProp = null,
}) {
  const location = useLocation();
  const pathname = location.pathname || "";
  const { can } = usePermissions();

  const [user, setUser] = useState(userProp);

  useEffect(() => {
    if (userProp) setUser(userProp);
  }, [userProp]);

  useEffect(() => {
    if (userProp) return;
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch (err) {
      console.error("[STUDENT][NAVBAR][LOCAL_USER][ERROR]", err);
    }
  }, [userProp]);

  useEffect(() => {
    if (userProp || user) return;
    let abort = false;

    async function fetchMe() {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!abort) setUser(data?.user || data);
      } catch (err) {
        console.error("[STUDENT][NAVBAR][ME][ERROR]", err);
      }
    }

    fetchMe();
    return () => {
      abort = true;
    };
  }, [userProp, user]);

  let activeKey = current;
  if (!activeKey) {
    if (pathname === "/student") activeKey = "dashboard";
    else if (
      pathname.startsWith("/student/browse") ||
      pathname.startsWith("/student/details")
    )
      activeKey = "browse";
    else if (pathname.startsWith("/student/uploads")) activeKey = "upload";
    else if (pathname.startsWith("/student/activity")) activeKey = "activity";
    else if (pathname.startsWith("/student/about")) activeKey = "about";
    else if (pathname.startsWith("/student/contact")) activeKey = "contact";
    else if (pathname.startsWith("/student/profile")) activeKey = "profile";
    else if (pathname.startsWith("/student/bookmarks")) activeKey = "bookmarks";
    else activeKey = "dashboard";
  }

  const isActive = (key) => (activeKey === key ? "active" : "");

  const go = (dest) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigate(dest);
  };

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.studentName ||
    user?.email ||
    "Student";

  return (
    <header className="dashboard-header">
      <div
        className="logo-area"
        onClick={go("profile")}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onNavigate("profile");
        }}
      >
        <div className="logo-title">{displayName}</div>
      </div>

      <nav className="nav-links">
        <a href="#" className={isActive("dashboard")} onClick={go("dashboard")}>
          Home
        </a>

        <a href="#" className={isActive("browse")} onClick={go("browse")}>
          Browse
        </a>

        {can.projectCreate && (
          <a href="#" className={isActive("upload")} onClick={go("upload")}>
            Upload
          </a>
        )}

        <a href="#" className={isActive("activity")} onClick={go("activity")}>
          Activity
        </a>

        <a href="#" className={isActive("about")} onClick={go("about")}>
          About
        </a>

        <a href="#" className={isActive("contact")} onClick={go("contact")}>
          Contact
        </a>

        <a href="#" className={isActive("profile")} onClick={go("profile")}>
          Profile
        </a>
      </nav>

      <div className="nav-spacer" aria-hidden="true" />
    </header>
  );
}
