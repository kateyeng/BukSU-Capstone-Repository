// src/Public/PublicNavbar.jsx
import { Link, NavLink } from "react-router-dom";
import "../index.css";

export default function PublicNavbar({
    authClick,          // optional: custom button action (e.g. Login)
    authLabel = "Login" // optional: label for the button
}) {
    return (
        <header className="dashboard-header">
            {/* Logo → public home */}
            <Link
                className="logo-area"
                to="/"
                style={{ textDecoration: "none", cursor: "pointer" }}
            >
                <div className="logo-square" />
                <div>
                    <div className="logo-title">BukSU CoT</div>
                    <div className="logo-subtitle">Capstone Repository</div>
                </div>
            </Link>

            {/* Main nav (guest) */}
            <nav className="nav-links">
                <NavLink to="/" end>
                    Home
                </NavLink>
                <NavLink to="/browse">Browse</NavLink>
                <NavLink to="/about">About</NavLink>
                <NavLink to="/contact">Contact</NavLink>
            </nav>

            {/* Right button: custom handler or simple Login link */}
            {authClick ? (
                <button className="logout-btn" onClick={authClick}>
                    {authLabel}
                </button>
            ) : (
                <Link className="logout-btn" to="/login">
                    Login
                </Link>
            )}
        </header>
    );
}
