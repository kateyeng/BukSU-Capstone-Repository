// src/Students/Dashboard.jsx
import { useEffect, useState } from "react";
import "./../index.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Dashboard({
  onLogin,
  onLogout,
  onNavigate = () => {},
}) {
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState({ total: null, latestUploads: null });
  const [loading, setLoading] = useState(false);
  const [projErr, setProjErr] = useState("");
  const [statsErr, setStatsErr] = useState("");

  useEffect(() => {
    let cancel = false;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setProjErr(""); setStatsErr("");

      try {
        // show only approved & published on the student side
        const res = await fetch(
          `${API}/api/projects?limit=6&status=approved`,
          { credentials: "include", signal: ac.signal }
        );
        if (!res.ok) throw new Error(`Projects HTTP ${res.status}`);
        const data = await res.json();
        if (!cancel) setFeatured(data.items?.slice(0, 3) || []);
      } catch (e) {
        if (!cancel) {
          setProjErr("Couldn’t load featured projects.");
          console.error("[Student] featured error:", e);
        }
      }

      try {
        // stats are approved-only by default
        const sRes = await fetch(`${API}/api/projects/stats`, {
          credentials: "include",
          signal: ac.signal,
        });
        if (!sRes.ok) throw new Error(`Stats HTTP ${sRes.status}`);
        const s = await sRes.json();
        if (!cancel) setStats(s);
      } catch (e) {
        if (!cancel) {
          setStatsErr("Couldn’t load stats.");
          console.error("[Student] stats error:", e);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; ac.abort(); };
  }, []);

  const goHome    = (e) => { e?.preventDefault(); onNavigate("dashboard"); };
  const goBrowse  = (e) => { e?.preventDefault(); onNavigate("browse"); };
  const goAbout   = (e) => { e?.preventDefault(); onNavigate("about"); };
  const goContact = (e) => { e?.preventDefault(); onNavigate("contact"); };

  const authClick = onLogin || onLogout;
  const authLabel = onLogin ? "Login" : "Logout";

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-area" onClick={goHome} style={{cursor:"pointer"}}>
          <div className="logo-square" />
          <div>
            <div className="logo-title">BukSU CoT</div>
            <div className="logo-subtitle">Thesis Realm</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" className="active" onClick={goHome}>Home</a>
          <a href="#" onClick={goBrowse}>Browse</a>
          <a href="#" onClick={goAbout}>About</a>
          <a href="#" onClick={goContact}>Contact</a>
        </nav>

        <button className="logout-btn" onClick={authClick}>{authLabel}</button>
      </header>

      {/* Hero */}
      <main className="hero">
        <div className="hero-content">
          <h1>BukSU CoT Thesis Realm</h1>
          <p>
            Discover, explore, and share academic excellence. A centralized platform
            for thesis and capstone projects at Bukidnon State University College of Technology.
          </p>
          <div className="hero-buttons">
            <button className="browse-btn" onClick={goBrowse}>Browse Projects</button>
          </div>
        </div>
      </main>

      {/* Stats */}
      <section className="stats">
        {[
          { label: "Total Projects",  value: stats.total,         sub: statsErr ? "Error" : "Published Projects",          icon: "book"   },
          { label: "Latest Uploads", value: stats.latestUploads, sub: statsErr ? "Error" : "Past 7 days published",       icon: "upload" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-left">
              <div className="stat-header">{s.label}</div>
              <div className="stat-value">
                {s.value == null ? "—" : Number(s.value).toLocaleString()}
              </div>
              <div className="stat-sub">
                {s.value == null && !statsErr ? (loading ? "Loading..." : "—") : s.sub}
              </div>
            </div>
            <div className="stat-icon-box" aria-hidden>
              {s.icon === "book" &&   <svg className="stat-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M6 4h11a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3V6a2 2 0 0 1 2-2m0 2v12a4 4 0 0 1 2-.54h9V6z"/></svg>}
              {s.icon === "upload" && <svg className="stat-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3l5 5h-3v6h-4V8H7l5-5M5 17h14v2H5z"/></svg>}
            </div>
          </div>
        ))}
      </section>

      {/* Featured */}
      <section className="featured">
        <h2 className="featured-title text-center">Featured Projects</h2>
        <p className="featured-subtitle text-center">
          Explore the latest research and innovation from our talented students and faculty members.
        </p>

        {loading && <p className="text-center">Loading featured projects...</p>}
        {projErr && <p className="text-center" style={{ color: "#c65" }}>{projErr}</p>}

        <div className="project-grid">
          {featured.map((p) => (
            <article key={p._id} className="project-card">
              <span className="badge blue">{p.category}</span>
              <h3 className="project-title">{p.title}</h3>

              <div className="meta">
                <div className="meta-item" title="Authors">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-label="authors">
                    <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5"/>
                  </svg>
                  <span>{Array.isArray(p.authors) ? p.authors.join(", ") : p.authors}</span>
                </div>
                <div className="meta-item" title="Year">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-label="year">
                    <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 9h14v10H5z"/>
                  </svg>
                  <span>{p.year}</span>
                </div>
              </div>

              <p className="project-excerpt">
                {p.abstract?.slice(0, 120)}{p.abstract?.length > 120 ? "..." : ""}
              </p>

              <div className="card-actions">
                <button className="btn-card" onClick={() => onNavigate("details", p._id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"/>
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
              <path fill="currentColor" d="M10 17l5-5l-5-5v10z"/>
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
