import { useEffect, useMemo, useState } from "react";
import "./teacher.css";
import Sidebar from "./Sidebar.jsx";
import usePermissions from "../hooks/usePermissions";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Activity({ onLogout }) {
  const { can } = usePermissions();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [printing, setPrinting] = useState(false);

  const PAGE_SIZE = 10;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/teacher/thesis?limit=1000`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setItems(json.thesis || json || []);
    } catch (err) {
      console.error("[TeacherActivity] load error", err);
      alert("Failed to load activity list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (can.thesisView) {
      load();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [can.thesisView]);

  function buildDownloadUrl(thesis) {
    if (!thesis?._id) return null;
    return `${API}/api/publicProjects/${thesis._id}/download`;
  }

  function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }

  function getStatusBadgeClass(status) {
    const s = String(status || "pending").toLowerCase();
    if (s === "approved") return "approved";
    if (s === "rejected") return "rejected";
    return "pending";
  }

  const filteredItems = useMemo(() => {
    const lower = q.toLowerCase();

    return items
      .filter((t) => {
        if (statusFilter === "all") return true;
        return (t.status || "pending") === statusFilter;
      })
      .filter((t) => {
        if (!lower) return true;

        const text = [
          t.title,
          t.category,
          t.year,
          t.abstract,
          t.status,
          ...(t.authors || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(lower);
      })
      .sort((a, b) => {
        const aT = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bT = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bT - aT;
      });
  }, [items, q, statusFilter]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => {
      const maxPage = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
      return Math.min(p, maxPage);
    });
  }, [totalItems]);

  const rows = useMemo(() => {
    if (printing) return filteredItems;
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredItems.slice(start, end);
  }, [filteredItems, page, printing]);

  function handleGeneratePdf() {
    setPrinting(true);

    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(false), 0);
    }, 0);
  }

  const nowText = formatDateTime(new Date().toISOString());

  return (
    <div className="admin-shell">
      <Sidebar onLogout={onLogout} />

      <main className="admin-main">
        <div className="page-head">
          <div>
            <h1>Activity</h1>
            <div className="sub">
              List of thesis activity with status and timestamps
            </div>
          </div>

          {can.thesisView && (
            <div className="actions">
              <button className="btn" onClick={load} disabled={loading}>
                {loading ? "Loading…" : "Refresh"}
              </button>
              <button className="btn brand" onClick={handleGeneratePdf}>
                Generate PDF
              </button>
            </div>
          )}
        </div>

        {!can.thesisView ? (
          <div className="card">
            <div className="label">Access Restricted</div>
            <p className="small" style={{ marginTop: 10, color: "#92400e" }}>
              Activity viewing permission is currently disabled by admin.
            </p>
          </div>
        ) : (
          <>
            <div className="filters">
              <input
                className="input"
                placeholder="Search title, category, author, status..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />

              <select
                className="select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <div className="hint">
                Showing {rows.length} of {totalItems} thesis
              </div>
            </div>

            <div className="card activity-print-area">
              <div className="label">Teacher Thesis Activity</div>
              <p className="small">Generated at: {nowText}</p>

              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 260 }}>Title</th>
                    <th>Category</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Authors</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                    {!printing && can.projectDownload && (
                      <th style={{ width: 110 }}>PDF</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const created = formatDateTime(t.createdAt);
                    const updated = formatDateTime(t.updatedAt || t.createdAt);

                    return (
                      <tr key={t._id}>
                        <td>{t.title || "—"}</td>
                        <td>{t.category || "—"}</td>
                        <td>{t.year || "—"}</td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(t.status)}`}
                          >
                            {t.status || "pending"}
                          </span>
                        </td>
                        <td>
                          {(t.authors || []).length > 0
                            ? (t.authors || []).join(", ")
                            : "—"}
                        </td>
                        <td>{created}</td>
                        <td>{updated}</td>
                        {!printing && can.projectDownload && (
                          <td>
                            <button
                              className="btn"
                              style={{
                                background: "#111827",
                                color: "#fff",
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                              }}
                              onClick={() => {
                                const url = buildDownloadUrl(t);
                                if (!url) {
                                  alert("No PDF file available for this thesis.");
                                  return;
                                }
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                            >
                              View PDF
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {!rows.length && (
                    <tr>
                      <td colSpan={!printing && can.projectDownload ? 8 : 7}>
                        No thesis found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {!printing && totalItems > PAGE_SIZE && (
                <div className="pagination">
                  <button
                    className="btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}