// src/Admin/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./admin.css";

export default function AdminLayout({ currentUser, onLogout }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onLogout) onLogout();
        // if your onLogout already redirects, no need to navigate here
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
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

                    {/* 🆕 Backup & Restore */}
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
                            "admin-nav-link" + (isActive ? " admin-nav-link-active" : "")
                        }
                        >
                        Activity
                    </NavLink>


                </nav>

                <button className="admin-logout-btn" onClick={handleLogout}>
                    Logout
                    {currentUser?.fullName ? ` • ${currentUser.fullName}` : ""}
                </button>
            </aside>

            {/* Main content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h1 className="admin-title">Admin</h1>
                    {currentUser && (
                        <div className="admin-user-info">
                            <span>{currentUser.fullName}</span>
                            <span className="admin-role-pill">
                                {currentUser.role}
                            </span>
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
