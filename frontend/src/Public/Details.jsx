// frontend/src/teacher/Details.jsx
import { useEffect, useState } from "react";
import "../index.css";

const API = import.meta.env.VITE_API_URL;

export default function Details({ id, onNavigate }) {
  const [proj, setProj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let abort = false;

    async function fetchProject() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/projects/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!abort) setProj(data);
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load project");
      } finally {
        if (!abort) setLoading(false);
      }
    }

    fetchProject();
    return () => { abort = true; };
  }, [id]);

  const fileUrl =
  proj?.fileUrl
  || (proj?.filePath
        ? (proj.filePath.startsWith("http")
            ? proj.filePath // in case some old records stored a full URL here
            : `${API}/${proj.filePath.replace(/^\/+/, "")}`)
        : null);

  const goHome    = (e) => { e?.preventDefault(); onNavigate?.("dashboard"); };
  const goBrowse  = (e) => { e?.preventDefault(); onNavigate?.("browse"); };
  const goAbout   = (e) => { e?.preventDefault(); onNavigate?.("about"); };
  const goContact = (e) => { e?.preventDefault(); onNavigate?.("contact"); };
  const goLogin   = (e) => { e?.preventDefault(); onNavigate?.("login"); };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-area" onClick={goHome} style={{cursor:"pointer"}}>
          <div className="logo-square" />
          <div>
            <div className="logo-title">BukSU CoT</div>
            <div className="logo-subtitle">Capstone Repository</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" onClick={goHome}>Home</a>
          <a href="#" onClick={goBrowse}>Browse</a>
          {/* Upload removed */}
          <a href="#" onClick={goAbout}>About</a>
          <a href="#" onClick={goContact}>Contact</a>
        </nav>

        {/* Back removed -> Login */}
        <button className="logout-btn" onClick={goLogin}>Login</button>
      </header>

      <div className="details-page">
        {loading && <p style={{padding:"16px"}}>Loading project…</p>}
        {err && <p style={{padding:"16px", color:"#c00"}}>Error: {err}</p>}

        {proj && (
          <div className="details-layout">
            {/* Left: metadata */}
            <section className="details-meta card">
              <span className="badge blue">{proj.category}</span>
              <h1 className="details-title">{proj.title}</h1>

              <div className="meta">
                <div className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5"/>
                  </svg>
                  <span>
                    {Array.isArray(proj.authors) ? proj.authors.join(", ") : proj.authors}
                  </span>
                </div>
                <div className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 9h14v10H5z"/>
                  </svg>
                  <span>{proj.year}</span>
                </div>
                {proj.adviser && (
                  <div className="meta-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                      <path fill="currentColor" d="M12 2a5 5 0 0 1 5 5c0 3.87-5 9-5 9S7 10.87 7 7a5 5 0 0 1 5-5m0 6.5A1.5 1.5 0 1 0 12 5a1.5 1.5 0 0 0 0 3z"/>
                    </svg>
                    <span>Adviser: {proj.adviser}</span>
                  </div>
                )}
              </div>

              {proj.tags?.length > 0 && (
                <div className="tags">
                  {proj.tags.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              )}

              <h2 className="subhead">Abstract</h2>
              <p className="project-excerpt" style={{whiteSpace:"pre-wrap"}}>
                {proj.abstract || "—"}
              </p>

              <div className="details-actions">
                <a
                  className="btn-card"
                  href={`${API}/api/projects/${proj._id}/download`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M5 20h14v-2H5m7-14v8l3.5-3.5l1.42 1.42L12 18.34l-4.92-4.92L8.5 10.5L12 14.03V4z"/>
                  </svg>
                  Download PDF
                </a>

                <button
                  className="btn-ghost"
                  onClick={goBrowse}
                >
                  Back to Browse
                </button>
              </div>
            </section>

            {/* Right: PDF preview (if available) */}
            <section className="details-preview card">
              <h2 className="subhead">Preview</h2>
              {!fileUrl ? (
                <p style={{color:"#666"}}>No file available.</p>
              ) : (
                <div className="pdf-frame-wrap">
                  <iframe
                    className="pdf-frame"
                    title="Thesis PDF"
                    src={`${fileUrl}#toolbar=1`}
                    allow="fullscreen" 
                  />
                  <div className="pdf-fallback">
                    Having trouble viewing?{" "}
                    <a href={fileUrl} target="_blank" rel="noreferrer">Open in new tab</a>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
