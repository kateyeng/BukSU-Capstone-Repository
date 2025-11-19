// src/teacher/Profile.jsx
import { useEffect, useState } from "react";
import api from "../api/axios.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export default function Profile({ onLogout, onNavigate = () => {} }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // helper for navbar
  const go = (dest) => (e) => {
    e.preventDefault();
    onNavigate(dest);
  };

  useEffect(() => {
    let abort = false;

    async function fetchMe() {
      try {
        setLoading(true);
        setErr("");

        // ✅ match backend path used in App.jsx
        const res = await api.get("/api/auth/me", {
          withCredentials: true,
        });

        const data = res.data;
        const user = data?.user || data; // support both shapes

        if (!abort) setMe(user);
      } catch (e) {
        if (!abort) {
          const msg =
            e.response?.data?.message ||
            e.message ||
            "Failed to load profile";
          setErr(msg);
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }

    fetchMe();
    return () => {
      abort = true;
    };
  }, []);

  const handleConnectGoogle = () => {
    const url = `${API}/api/auth/google`;
    window.location.href = url;
  };

  /* ---------- Loading / error states ---------- */
  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="logo-area">
            <div className="logo-square" />
            <div>
              <div className="logo-title">BUKSU Archive</div>
              <div className="logo-subtitle">Teacher Portal</div>
            </div>
          </div>

          <nav className="nav-links">
            <a href="#" onClick={go("dashboard")}>Home</a>
            <a href="#" onClick={go("browse")}>Browse</a>
            <a href="#" onClick={go("upload")}>Upload</a>
            <a href="#" onClick={go("about")}>About</a>
            <a href="#" onClick={go("contact")}>Contact</a>
            <a href="#" className="active" onClick={(e) => e.preventDefault()}>
              Profile
            </a>
          </nav>

          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </header>

        <main className="details-page">
          <div className="card">
            <p>Loading profile…</p>
          </div>
        </main>
      </div>
    );
  }

  if (err || !me) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="logo-area">
            <div className="logo-square" />
            <div>
              <div className="logo-title">BUKSU Archive</div>
              <div className="logo-subtitle">Teacher Portal</div>
            </div>
          </div>

          <nav className="nav-links">
            <a href="#" onClick={go("dashboard")}>Home</a>
            <a href="#" onClick={go("browse")}>Browse</a>
            <a href="#" onClick={go("upload")}>Upload</a>
            <a href="#" onClick={go("about")}>About</a>
            <a href="#" onClick={go("contact")}>Contact</a>
            <a href="#" className="active" onClick={(e) => e.preventDefault()}>
              Profile
            </a>
          </nav>

          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </header>

        <main className="details-page">
          <div className="card">
            <h2 className="details-title">My Profile</h2>
            <p className="profile-error">
              {err || "You must be logged in to view your profile."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const bookmarksCount = Array.isArray(me.bookmarks) ? me.bookmarks.length : 0;

  /* ---------- Normal render ---------- */
  return (
    <div className="dashboard">
      {/* same header as other teacher pages, Profile active */}
      <header className="dashboard-header">
        <div className="logo-area">
          <div className="logo-square" />
          <div>
            <div className="logo-title">BUKSU CoT</div>
            <div className="logo-subtitle">Capstone Repository</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" onClick={go("dashboard")}>Home</a>
          <a href="#" onClick={go("browse")}>Browse</a>
          <a href="#" onClick={go("upload")}>Upload</a>
          <a href="#" onClick={go("about")}>About</a>
          <a href="#" onClick={go("contact")}>Contact</a>
          <a href="#" className="active" onClick={(e) => e.preventDefault()}>
            Profile
          </a>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      {/* main profile layout (reuses your details styles) */}
      <main className="details-page">
        <div className="details-layout">
          {/* LEFT CARD – BASIC INFO */}
          <div className="card">
            <div className="details-topbar">
              <h2 className="details-title">My Profile</h2>
              {me.role && <span className="count-pill">{me.role}</span>}
              <span className="spacer" />
            </div>

            <div className="profile-main-row">
              {/* Avatar */}
              <div className="profile-avatar">
                {me.profilePic ? (
                  <img
                    src={me.profilePic}
                    alt={me.fullName}
                    className="profile-avatar-img"
                  />
                ) : (
                  <span className="profile-avatar-initials">
                    {getInitials(me.fullName)}
                  </span>
                )}
              </div>

              {/* Name + email */}
              <div className="profile-name-block">
                <h3 className="project-title profile-name">
                  {me.fullName || "Unnamed User"}
                </h3>
                <div className="meta">
                  <div className="meta-item">
                    <span>{me.email}</span>
                  </div>
                  {me.age ? (
                    <div className="meta-item">
                      <span>Age: {me.age}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Extra info using your tag pills */}
            <div className="tags">
              {me.address && <span className="tag">📍 {me.address}</span>}
              {me.phone && <span className="tag">📞 {me.phone}</span>}
              <span className="tag">
                Joined:{" "}
                {me.createdAt
                  ? new Date(me.createdAt).toLocaleDateString()
                  : "N/A"}
              </span>
              <span className="tag">Bookmarks: {bookmarksCount}</span>
            </div>
          </div>

          {/* RIGHT CARD – ACCOUNT / GOOGLE BINDING */}
          <div className="card">
            <h3 className="subhead">Account &amp; Sign-in</h3>

            <p className="profile-line">
              <strong>Primary email:</strong> {me.email}
            </p>

            <p className="profile-line">
              <strong>Login method:</strong>{" "}
              {me.googleId ? "Google account" : "Email & password"}
            </p>

            <p className="profile-line">
              <strong>Email verified:</strong>{" "}
              {me.isEmailVerified ? "Yes" : "No"}
            </p>

            {me.googleId ? (
              <>
                <p className="profile-line">
                   Your profile is already linked to a Google account.
                </p>
                <p className="profile-note">
                  You can continue signing in with Google or with your email
                  &amp; password (if you set a password).
                </p>
              </>
            ) : (
              <>
                <p className="profile-line">
                  You can connect a Google account so you can use{" "}
                  <strong>“Continue with Google”</strong> next time.
                </p>

                <button
                  type="button"
                  className="google-btn"
                  onClick={handleConnectGoogle}
                >
                  <span>Connect Google account</span>
                </button>

                <p className="profile-note">
                  We’ll redirect you to Google. After you confirm, this account
                  will be linked and you’ll be able to log in using Google.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
