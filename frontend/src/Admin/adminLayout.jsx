// src/Admin/AdminLayout.jsx
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminLayout({ currentUser, onLogout }) {
    const [me, setMe] = useState(currentUser || null);

    useEffect(() => {
        if (currentUser) {
            setMe(currentUser);
            return;
        }

        let abort = false;

        async function fetchMe() {
            try {
                const res = await fetch(`${API}/api/auth/me`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) return;

                const data = await res.json();
                if (!abort) {
                    setMe(data?.user || data || null);
                }
            } catch (err) {
                console.error("[ADMIN][LAYOUT][ME][ERROR]", err);
            }
        }

        fetchMe();

        return () => {
            abort = true;
        };
    }, [currentUser]);

    const displayName =
        me?.fullName ||
        me?.name ||
        me?.email?.split("@")?.[0] ||
        "Admin";

    const handleLogout = () => {
        if (onLogout) onLogout();
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <span className="admin-logo-text">Admin Panel</span>
                </div>

                <nav className="admin-nav">
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Users
                    </NavLink>

                    <NavLink
                        to="/admin/teachers"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Teacher Panel
                    </NavLink>

                    <NavLink
                        to="/admin/students"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Student Panel
                    </NavLink>

                    <NavLink
                        to="/admin/permissions"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Role Permissions
                    </NavLink>

                    <NavLink
                        to="/admin/capstone"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Capstone
                    </NavLink>

                    <NavLink
                        to="/admin/backup"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Backup &amp; Restore
                    </NavLink>

                    <NavLink
                        to="/admin/activity"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Activity
                    </NavLink>

                    <NavLink
                        to="/admin/notifications"
                        className={({ isActive }) =>
                            "admin-nav-link" +
                            (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Notifications
                    </NavLink>
                </nav>

                <button className="admin-logout-btn" onClick={handleLogout}>
                    Logout
                    {displayName ? ` • ${displayName}` : ""}
                </button>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1 className="admin-title">Admin</h1>
                    {me && (
                        <div className="admin-user-info">
                            <span>{displayName}</span>
                            <span className="admin-role-pill">{me.role}</span>
                        </div>
                    )}
                </header>

                <section className="admin-content">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}
