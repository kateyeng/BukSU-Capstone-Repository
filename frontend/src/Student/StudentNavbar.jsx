// src/Student/StudentNavbar.jsx
import { useLocation } from "react-router-dom";
import "../index.css";

export default function StudentNavbar({
    current = null,        // optional manual override
    onLogout = () => { },
    onNavigate = () => { },
}) {
    const location = useLocation();
    const pathname = location.pathname || "";

    // If parent didn't pass `current`, infer it from the URL
    let activeKey = current;
    if (!activeKey) {
        if (pathname === "/student") {
            activeKey = "dashboard";
        } else if (
            pathname.startsWith("/student/browse") ||
            pathname.startsWith("/student/details")
        ) {
            activeKey = "browse";
        } else if (pathname.startsWith("/student/uploads")) {
            activeKey = "upload";
        } else if (pathname.startsWith("/student/about")) {
            activeKey = "about";
        } else if (pathname.startsWith("/student/contact")) {
            activeKey = "contact";
        } else if (pathname.startsWith("/student/profile")) {
            activeKey = "profile";
        } else {
            activeKey = "dashboard";
        }
    }

    const go = (dest) => (e) => {
        e.preventDefault();
        onNavigate(dest);
    };

    const isActive = (key) => (activeKey === key ? "active" : "");

    return (
        <header className="dashboard-header">
            {/* Logo → student dashboard */}
            <div
                className="logo-area"
                onClick={go("dashboard")}
                style={{ cursor: "pointer" }}
            >
                <div className="logo-square" />
                <div>
                    <div className="logo-title">BukSU CoT</div>
                    <div className="logo-subtitle">Capstone Repository</div>
                </div>
            </div>

            <nav className="nav-links">
                <a
                    href="#"
                    className={isActive("dashboard")}
                    onClick={go("dashboard")}
                >
                    Home
                </a>
                <a
                    href="#"
                    className={isActive("browse")}
                    onClick={go("browse")}
                >
                    Browse
                </a>
                <a
                    href="#"
                    className={isActive("upload")}
                    onClick={go("upload")}
                >
                    Upload
                </a>
                <a
                    href="#"
                    className={isActive("about")}
                    onClick={go("about")}
                >
                    About
                </a>
                <a
                    href="#"
                    className={isActive("contact")}
                    onClick={go("contact")}
                >
                    Contact
                </a>
                <a
                    href="#"
                    className={isActive("profile")}
                    onClick={go("profile")}
                >
                    Profile
                </a>
            </nav>

            <button className="logout-btn" onClick={onLogout}>
                Logout
            </button>
        </header>
    );
}
