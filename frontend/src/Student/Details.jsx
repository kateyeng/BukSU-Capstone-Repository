import { useEffect, useState } from "react";
import "../index.css";
import api from "../api/axios.js";
import StudentNavbar from "./StudentNavbar.jsx";
import BookmarkButton from "../hooks/BookmarkButton.jsx";
import usePermissions from "../hooks/usePermissions";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Details({ id, onLogout, onNavigate }) {
  const { can } = usePermissions();

  const [proj, setProj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
        console.error("[Student Details] error:", e);

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
      <StudentNavbar
        onLogout={onLogout}
        onNavigate={onNavigate}
        active="browse"
      />

      <div className="details-page">
        {loading && <p style={{ padding: "16px" }}>Loading project…</p>}

        {err && (
          <p style={{ padding: "16px", color: "#c00" }}>
            {err === "NOT_FOUND"
              ? "Project not found or not yet approved/published."
              : `Error: ${err}`}
          </p>
        )}

        {proj && (
          <div className="details-layout">
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

                {proj.adviserName && (
                  <div className="meta-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M12 2a5 5 0 0 1 5 5c0 3.87-5 9-5 9S7 10.87 7 7a5 5 0 0 1 5-5m0 6.5A1.5 1.5 0 1 0 12 5a1.5 1.5 0 0 0 0 3z"
                      />
                    </svg>
                    <span>Adviser: {proj.adviserName}</span>
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
              <p className="project-excerpt" style={{ whiteSpace: "pre-wrap" }}>
                {proj.abstract || "—"}
              </p>

              <div className="details-actions details-actions-public">
                {can.projectDownload ? (
                  <a
                    className="btn-card btn-download"
                    href={`${API}/api/publicProjects/${proj._id}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="btn-download-icon">⬇</span>
                    <span>Download PDF</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    className="btn-card btn-download"
                    disabled
                  >
                    <span className="btn-download-icon">⬇</span>
                    <span>Download Disabled</span>
                  </button>
                )}

                <button className="btn-back-link" onClick={go("browse")}>
                  ← Back to Browse
                </button>

                <BookmarkButton projectId={proj._id} />
              </div>
            </section>

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