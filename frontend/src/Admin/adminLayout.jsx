import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./admin.css";

export default function AdminLayout({ currentUser, onLogout }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onLogout) onLogout();
        // after logout you already navigate to "/", so nothing else needed
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
                            "admin-nav-link" + (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            "admin-nav-link" + (isActive ? " admin-nav-link-active" : "")
                        }
                    >
                        Users
                    </NavLink>
                </nav>

                <button className="admin-logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </aside>

            {/* Main content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h1 className="admin-title">Admin</h1>
                    {currentUser && (
                        <div className="admin-user-info">
                            <span>{currentUser.fullName}</span>
                            <span className="admin-role-pill">{currentUser.role}</span>
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
