// frontend/src/Public/Details.jsx
import { useEffect, useState } from "react";
import "../index.css";
import api from "../api/axios.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Details({ id, onNavigate }) {
  const [proj, setProj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [canDownload, setCanDownload] = useState(false); // 👈 RBAC flag

  // 1) Ask backend RBAC if GUEST can download projects
  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        const res = await api.get("/api/rbac/guest-permissions");
        if (!cancel) {
          setCanDownload(!!res.data?.canDownloadProject);
        }
      } catch (e) {
        console.error("[Public Details] RBAC fetch error:", e);
        if (!cancel) setCanDownload(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  // 2) Load the public project details
  useEffect(() => {
    let abort = false;
    const ac = new AbortController();

    const timeoutId = setTimeout(() => {
      if (!abort) {
        setErr(
          "No response from server. Check /api/publicProjects/:id and server logs."
        );
        setLoading(false);
      }
    }, 8000);

    (async () => {
      try {
        setLoading(true);
        setErr("");

        if (!id) throw new Error("Missing project id in URL");

        const res = await api.get(`/api/publicProjects/${id}`, {
          signal: ac.signal,
        });

        if (!abort) setProj(res.data);
      } catch (e) {
        if (e.code === "ERR_CANCELED" || e.name === "CanceledError") return;
        console.error("[Public Details] error:", e);

        if (!abort) {
          const status = e.response?.status;
          setErr(
            status === 404
              ? "NOT_FOUND"
              : e.message || "Failed to load project"
          );
        }
      } finally {
        clearTimeout(timeoutId);
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
      ac.abort();
      clearTimeout(timeoutId);
    };
  }, [id]);

  const fileUrl =
    proj?.fileUrl ||
    (proj?.filePath
      ? proj.filePath.startsWith("http")
        ? proj.filePath
        : `${API}/${proj.filePath.replace(/^\/+/, "")}`
      : null);

  const go = (dest) => (e) => {
    e?.preventDefault();
    onNavigate?.(dest);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div
          className="logo-area"
          onClick={go("dashboard")}
          style={{ cursor: "pointer" }}
        >
          <div className="logo-square" />
          <div>
            <div className="logo-title">BukSU CoT</div>
            <div className="logo-subtitle">Capstone Repository</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" onClick={go("dashboard")}>
            Home
          </a>
          <a href="#" className="active" onClick={go("browse")}>
            Browse
          </a>
          <a href="#" onClick={go("about")}>
            About
          </a>
          <a href="#" onClick={go("contact")}>
            Contact
          </a>
        </nav>

        <button className="logout-btn" onClick={go("login")}>
          Login
        </button>
      </header>

      {/* Content */}
      <div className="details-page">
        {loading && <p style={{ padding: "16px" }}>Loading project…</p>}

        {err && (
          <p style={{ padding: "16px", color: "#c00" }}>
            {err === "NOT_FOUND" ? "Project not found." : `Error: ${err}`}
          </p>
        )}

        {proj && (
          <div className="details-layout">
            {/* Left: metadata */}
            <section className="details-meta card">
              <span className="badge blue">{proj.category}</span>
              <h1 className="details-title">{proj.title}</h1>

              <div className="meta">
                <div className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5"
                    />
                  </svg>
                  <span>
                    {Array.isArray(proj.authors)
                      ? proj.authors.join(", ")
                      : proj.authors}
                  </span>
                </div>
                <div className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 9h14v10H5z"
                    />
                  </svg>
                  <span>{proj.year}</span>
                </div>
                {proj.adviser && (
                  <div className="meta-item">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        fill="currentColor"
                        d="M12 2a5 5 0 0 1 5 5c0 3.87-5 9-5 9S7 10.87 7 7a5 5 0 0 1 5-5m0 6.5A1.5 1.5 0 1 0 12 5a1.5 1.5 0 0 0 0 3z"
                      />
                    </svg>
                    <span>Adviser: {proj.adviser}</span>
                  </div>
                )}
              </div>

              {proj.tags?.length > 0 && (
                <div className="tags">
                  {proj.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="subhead">Abstract</h2>
              <p
                className="project-excerpt"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {proj.abstract || "—"}
              </p>

              <div className="details-actions details-actions-public">
                {/* Download only if admin RBAC grants guest project:download */}
                {canDownload && (
                  <a
                    className="btn-card btn-download"
                    href={`${API}/api/publicProjects/${proj._id}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="btn-download-icon">⬇</span>
                    <span>Download PDF</span>
                  </a>
                )}

                <button className="btn-back-link" onClick={go("browse")}>
                  ← Back to Browse
                </button>
              </div>
            </section>

            {/* Right: PDF preview */}
            <section className="details-preview card">
              <h2 className="subhead">Preview</h2>
              {!fileUrl ? (
                <p style={{ color: "#666" }}>No file available.</p>
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
                    <a href={fileUrl} target="_blank" rel="noreferrer">
                      Open in new tab
                    </a>
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
