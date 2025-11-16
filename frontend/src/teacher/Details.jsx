import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../index.css";
import BookmarkButton from "../hooks/BookmarkButton.jsx";
import api from "../api/axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Details({ onLogout, onNavigate }) {
  const [proj, setProj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const { id } = useParams();   // <-- get :id from /details/:id

  useEffect(() => {
  let abort = false;
  const ac = new AbortController();

      const timeoutId = setTimeout(() => {
        if (!abort) {
          setErr("No response from server. Check /api/projects/:id and server logs.");
          setLoading(false);
        }
      }, 8000);

      (async () => {
        try {
          setLoading(true);
          setErr("");

          if (!id) throw new Error("Missing project id in URL");

           const res = await api.get(`/api/projects/${id}`, { signal: ac.signal });
           const data = res.data;
          if (!abort) setProj(data);
        } catch (e) {
          // Ignore axios cancel errors
          if (e.code === "ERR_CANCELED" || e.name === "CanceledError") {
            return;
          }

          console.error("[Details] error:", e);
          if (!abort) setErr(e.message || "Failed to load project");
        } finally {
          clearTimeout(timeoutId);         // <-- clear here
          if (!abort) setLoading(false);
        }
      })();

      return () => {
        abort = true;
        ac.abort();
        clearTimeout(timeoutId);           // <-- and clear on unmount
      };
    }, [id]);

  const fileUrl =
  proj?.fileUrl
  || (proj?.filePath
        ? (proj.filePath.startsWith("http")
            ? proj.filePath                                // old records that put full URL in filePath
            : `${API}/${proj.filePath.replace(/^\/+/, "")}`) // old local uploads
        : null);
  const go = (dest) => (e) => { e?.preventDefault(); onNavigate?.(dest); };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo-area" onClick={go("dashboard")} style={{cursor:"pointer"}}>
          <div className="logo-square" />
          <div>
            <div className="logo-title">BukSU CoT</div>
            <div className="logo-subtitle">Thesis Realm</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" onClick={go("dashboard")}>Home</a>
          <a href="#" onClick={go("browse")}>Browse</a>
          <a href="#" onClick={go("about")}>About</a>
          <a href="#" onClick={go("contact")}>Contact</a>
        </nav>

        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      <div className="details-page">
        {loading && <p style={{padding:"16px"}}>Loading project…</p>}
         {err && (
   <p style={{padding:"16px", color:"#c00"}}>
     {/HTTP 404/.test(err)
       ? "Project not found or not yet approved/published."
       : `Error: ${err}`}
   </p>
 )}

        {proj && (
            <div className="details-layout">
              <section className="details-meta card">
                <div className="details-topbar">
                  <span className="badge blue">{proj.category}</span>
                  <div className="spacer" />
                  <BookmarkButton projectId={proj._id} />
                </div>

                <h1 className="details-title">{proj.title}</h1>

                <div className="meta">
                  <div className="meta-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5"/></svg>
                    <span>{Array.isArray(proj.authors) ? proj.authors.join(", ") : proj.authors}</span>
                  </div>
                  <div className="meta-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 9h14v10H5z"/></svg>
                    <span>{proj.year}</span>
                  </div>
                  {proj.adviser && (
                    <div className="meta-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 2a5 5 0 0 1 5 5c0 3.87-5 9-5 9S7 10.87 7 7a5 5 0 0 1 5-5m0 6.5A1.5 1.5 0 1 0 12 5a1.5 1.5 0 0 0 0 3z"/></svg>
                      <span>Adviser: {proj.adviser}</span>
                    </div>
                  )}
                </div>

                {proj.tags?.length > 0 && (
                  <div className="tags">
                    {proj.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                  </div>
                )}

                <h2 className="subhead">Abstract</h2>
                <p className="project-excerpt" style={{ whiteSpace: "pre-wrap" }}>
                  {proj.abstract || "—"}
                </p>

                <div className="details-actions">
                  <a
                  className="btn-card"
                  href={`${API}/api/projects/${proj._id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M5 20h14v-2H5m7-14v8l3.5-3.5l1.42 1.42L12 18.34l-4.92-4.92L8.5 10.5L12 14.03V4z"/></svg>
                    Download PDF
                  </a>
                </div>
              </section>

              <section className="details-preview card">
                <h2 className="subhead">Preview</h2>
                {!fileUrl ? (
                  <p style={{ color: "#666" }}>No file available.</p>
                ) : (
                  <div className="pdf-frame-wrap">
                    <iframe className="pdf-frame" title="Thesis PDF" src={`${fileUrl}#toolbar=1`} allow="fullscreen" />
                    <div className="pdf-fallback">
                      Having trouble viewing? <a href={fileUrl} target="_blank" rel="noreferrer">Open in new tab</a>
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
