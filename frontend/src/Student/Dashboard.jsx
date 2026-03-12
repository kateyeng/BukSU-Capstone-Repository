import { useEffect, useState } from "react";
import "./../index.css";
import api from "../api/axios.js";
import { useBookmarks } from "../hooks/useBookmarks.js";
import BookmarkButton from "../hooks/BookmarkButton.jsx";
import StudentNavbar from "./StudentNavbar.jsx";
import usePermissions from "../hooks/usePermissions";

export default function StudentDashboard({ onLogout, onNavigate = () => {} }) {
  const { can } = usePermissions();
  const { list: bookmarks } = useBookmarks();
  const bookmarksCount = (bookmarks.data || []).length;

  const [stats, setStats] = useState({
    total: null,
    latestUploads: null,
    pendingUploads: null,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsErr, setStatsErr] = useState("");

  useEffect(() => {
    let cancel = false;
    const ac = new AbortController();

    (async () => {
      try {
        setLoadingStats(true);
        setStatsErr("");
        const res = await api.get("/api/publicProjects/stats?mine=1", {
          signal: ac.signal,
        });
        if (!cancel) setStats(res.data);
      } catch (e) {
        if (!cancel) {
          console.error("[Student] stats error:", e);
          setStatsErr("Couldn’t load stats.");
        }
      } finally {
        if (!cancel) setLoadingStats(false);
      }
    })();

    return () => {
      cancel = true;
      ac.abort();
    };
  }, []);

  const go = (dest, id) => (e) => {
    e?.preventDefault();
    onNavigate(dest, id);
  };

  return (
    <div className="dashboard">
      <StudentNavbar
        onLogout={onLogout}
        onNavigate={onNavigate}
        active="dashboard"
      />

      <main className="hero">
        <div className="hero-content">
          <h1>BukSU CoT Thesis Realm</h1>
          <p>
            Discover, explore, and share academic excellence. A centralized
            platform for thesis and capstone projects at Bukidnon State
            University College of Technology.
          </p>
          <div className="hero-buttons">
            <button className="browse-btn" onClick={go("browse")}>
              Browse Projects
            </button>

            {can.projectCreate && (
              <button className="submit-btn" onClick={go("upload")}>
                Submit Thesis
              </button>
            )}
          </div>
        </div>
      </main>

      <section className="stats-teacher">
        {[
          {
            label: "Total Projects",
            value: stats.total,
            sub: statsErr ? "Error" : "Published Projects",
            icon: "book",
          },
          {
            label: "Latest Uploads",
            value: stats.latestUploads,
            sub: statsErr ? "Error" : "Past 7 days projects",
            icon: "upload",
          },
          {
            label: "My Pending Uploads",
            value: stats.pendingUploads,
            sub: statsErr ? "Error" : "Pending Approval",
            icon: "eye",
          },
          {
            label: "My Bookmarks",
            value: bookmarks.isLoading ? null : bookmarksCount,
            sub: "Saved documents",
            icon: "star",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-left">
              <div className="stat-header">{s.label}</div>
              <div className="stat-value">
                {s.value == null ? "—" : Number(s.value).toLocaleString()}
              </div>
              <div className="stat-sub">
                {s.value == null && !statsErr
                  ? loadingStats
                    ? "Loading..."
                    : "—"
                  : s.sub}
              </div>
            </div>
            <div className="stat-icon-box" aria-hidden>
              {s.icon === "book" && (
                <svg className="stat-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M6 4h11a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3V6a2 2 0 0 1 2-2m0 2v12a4 4 0 0 1 2-.54h9V6z"
                  />
                </svg>
              )}
              {s.icon === "upload" && (
                <svg className="stat-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 3l5 5h-3v6h-4V8H7l5-5M5 17h14v2H5z"
                  />
                </svg>
              )}
              {s.icon === "eye" && (
                <svg className="stat-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 6c5 0 9.27 3.11 11 7.5C21.27 17.89 17 21 12 21S2.73 17.89 1 13.5C2.73 9.11 7 6 12 6m0 3a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9"
                  />
                </svg>
              )}
              {s.icon === "star" && (
                <svg className="stat-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  />
                </svg>
              )}
            </div>
          </div>
        ))}
      </section>

      {!can.projectCreate && (
        <div
          style={{
            maxWidth: 1150,
            margin: "0 auto 18px",
            padding: "12px 14px",
            borderRadius: 12,
            background: "#fff7ed",
            color: "#9a3412",
            fontSize: 13,
          }}
        >
          Upload permission is currently disabled by admin.
        </div>
      )}

      <section className="featured">
        <h2 className="featured-title text-center">
          My Bookmarked Documents
          <span className="count-pill">
            {bookmarks.isLoading ? "…" : bookmarksCount}
          </span>
        </h2>
        <p className="featured-subtitle text-center">
          Quick access to papers you saved. You can add or remove bookmarks from
          any project’s details page.
        </p>

        {bookmarks.isLoading && (
          <p className="text-center">Loading bookmarks...</p>
        )}
        {bookmarks.isError && (
          <p className="text-center" style={{ color: "#c65" }}>
            Couldn’t load bookmarks.
          </p>
        )}

        <div className="project-grid">
          {(bookmarks.data || []).map((p) => (
            <article key={p._id} className="project-card">
              <span className="badge blue">{p.category}</span>
              <h3 className="project-title">{p.title}</h3>
              <div className="meta">
                <div className="meta-item" title="Year">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-label="year"
                  >
                    <path
                      fill="currentColor"
                      d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 9h14v10H5z"
                    />
                  </svg>
                  <span>{p.year}</span>
                </div>
              </div>

              <div className="card-actions" style={{ display: "flex", gap: 8 }}>
                {can.projectRead ? (
                  <button
                    className="btn-card"
                    onClick={() => onNavigate("details", p._id)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        fill="currentColor"
                        d="M3 6h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"
                      />
                    </svg>
                    View Details
                  </button>
                ) : (
                  <button
                    className="btn-card"
                    type="button"
                    disabled
                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                  >
                    View Disabled
                  </button>
                )}

                {(can.bookmarkCreate || can.bookmarkDelete) && (
                  <BookmarkButton projectId={p._id} />
                )}
              </div>
            </article>
          ))}
        </div>

        {!bookmarks.isLoading &&
          !bookmarks.isError &&
          (bookmarks.data || []).length === 0 && (
            <div className="text-center" style={{ marginTop: 16 }}>
              <p>You haven’t saved any documents yet.</p>
              <button className="btn-outline" onClick={go("browse")}>
                Browse Projects
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path fill="currentColor" d="M10 17l5-5l-5-5v10z" />
                </svg>
              </button>
            </div>
          )}
      </section>

      <footer className="footer">
        <small>
          © {new Date().getFullYear()} BukSU CoT — Thesis Realm
        </small>
      </footer>
    </div>
  );
}