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
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

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

  // Fetch comments for the project
  useEffect(() => {
    if (!proj?._id) return;

    let abort = false;
    setCommentsLoading(true);

    (async () => {
      try {
        const res = await api.get(`/api/comments?projectId=${proj._id}`);
        if (!abort) {
          setComments(res.data?.comments || []);
        }
      } catch (e) {
        console.error("[Student Details] Comments error:", e);
        if (!abort) setComments([]);
      } finally {
        if (!abort) setCommentsLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [proj?._id]);

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

              {/* Comments Section */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <h2 className="subhead">Adviser Feedback</h2>
                {commentsLoading ? (
                  <p style={{ fontSize: 14, color: "#666" }}>Loading feedback…</p>
                ) : comments.length === 0 ? (
                  <p style={{ fontSize: 14, color: "#999" }}>
                    No feedback yet.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                    {comments.map((c) => (
                      <div
                        key={c._id}
                        style={{
                          background: c.status === "resolved" ? "#f0fdf4" : "#f9fafb",
                          border: `1px solid ${c.status === "resolved" ? "#dcfce7" : "#e5e7eb"}`,
                          borderRadius: 6,
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            marginBottom: 6,
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 12, color: "#111" }}>
                              {c.authorName}
                            </strong>
                            {c.page && (
                              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                                Page {c.page}
                                {c.section && ` • ${c.section}`}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            lineHeight: 1.5,
                            color: "#374151",
                            whiteSpace: "pre-wrap",
                            margin: 0,
                          }}
                        >
                          {c.content}
                        </p>
                        {c.status === "resolved" && (
                          <div style={{ fontSize: 11, color: "#059669", marginTop: 6 }}>
                            ✓ Resolved
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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