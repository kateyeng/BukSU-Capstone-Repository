import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../index.css";
import PublicNavbar from "./PublicNavbar.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Dashboard({
  onLogin,
  onLogout,
  onNavigate = () => {},
}) {
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({ total: 0, latestUploads: 0 });
  const [loading, setLoading] = useState(false);
  const [projErr, setProjErr] = useState("");
  const [statsErr, setStatsErr] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let cancel = false;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setProjErr("");
      setStatsErr("");

      try {
        const res = await fetch(
          `${API}/api/publicProjects?limit=6&status=approved`,
          { signal: ac.signal }
        );

        if (!res.ok) throw new Error(`Projects HTTP ${res.status}`);

        const data = await res.json();

        if (!cancel) {
          setFeatured(Array.isArray(data.items) ? data.items.slice(0, 3) : []);
        }
      } catch (e) {
        if (!cancel) {
          setProjErr("Couldn’t load featured projects.");
          console.error("[Public] featured error:", e);
        }
      }

      try {
        const sRes = await fetch(`${API}/api/publicProjects/stats`, {
          signal: ac.signal,
        });

        if (!sRes.ok) throw new Error(`Stats HTTP ${sRes.status}`);

        const s = await sRes.json();

        if (!cancel) {
          setStats({
            total: Number(s.total) || 0,
            latestUploads: Number(s.latestUploads) || 0,
          });
        }
      } catch (e) {
        if (!cancel) {
          setStatsErr("Couldn’t load stats.");
          console.error("[Public] stats error:", e);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
      ac.abort();
    };
  }, []);

  const goBrowse = (e) => {
    e?.preventDefault();
    onNavigate("browse");
    navigate("/browse");
  };

  const goDetails = (id) => {
    onNavigate("details", id);
    navigate(`/details/${id}`);
  };

  const authClick = onLogin || onLogout;
  const authLabel = onLogin ? "Login" : "Logout";

  return (
    <div className="dashboard">
      <PublicNavbar authClick={authClick} authLabel={authLabel} />

      <main className="hero">
        <div className="hero-content">
          <h1>BukSU CoT Thesis Realm</h1>
          <p>
            Discover, explore, and share academic excellence. A centralized
            platform for thesis and capstone projects at Bukidnon State
            University College of Technology.
          </p>
          <div className="hero-buttons">
            <button className="browse-btn" onClick={goBrowse}>
              Browse Projects
            </button>
          </div>
        </div>
      </main>

      <section className="stats">
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
            sub: statsErr ? "Error" : "Past 7 days published",
            icon: "upload",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-left">
              <div className="stat-header">{s.label}</div>
              <div className="stat-value">
                {loading && !statsErr ? "—" : Number(s.value).toLocaleString()}
              </div>
              <div className="stat-sub">
                {loading && !statsErr ? "Loading..." : s.sub}
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
            </div>
          </div>
        ))}
      </section>

      <section className="featured">
        <h2 className="featured-title text-center">Featured Projects</h2>
        <p className="featured-subtitle text-center">
          Explore the latest research and innovation from our talented students
          and faculty members.
        </p>

        {loading && <p className="text-center">Loading featured projects...</p>}

        {projErr && (
          <p className="text-center" style={{ color: "#c65" }}>
            {projErr}
          </p>
        )}

        <div className="project-grid">
          {featured.map((p) => (
            <article key={p._id} className="project-card">
              <span className="badge blue">{p.category}</span>
              <h3 className="project-title">{p.title}</h3>

              <div className="meta">
                <div className="meta-item" title="Authors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-label="authors"
                  >
                    <path
                      fill="currentColor"
                      d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5"
                    />
                  </svg>
                  <span>
                    {Array.isArray(p.authors)
                      ? p.authors.join(", ")
                      : p.authors}
                  </span>
                </div>

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

              <p className="project-excerpt">
                {p.abstract?.slice(0, 120)}
                {p.abstract?.length > 120 ? "..." : ""}
              </p>

              <div className="card-actions">
                <button className="btn-card" onClick={() => goDetails(p._id)}>
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
              </div>
            </article>
          ))}
        </div>

        <div className="view-all-wrap">
          <button className="btn-outline" onClick={goBrowse}>
            View All Projects
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path fill="currentColor" d="M10 17l5-5l-5-5v10z" />
            </svg>
          </button>
        </div>
      </section>

      <footer className="footer">
        <small>© {new Date().getFullYear()} BukSU CoT — Thesis Realm</small>
      </footer>
    </div>
  );
}
