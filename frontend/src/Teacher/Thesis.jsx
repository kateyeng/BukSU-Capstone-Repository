// src/teacher/Thesis.jsx  (or wherever you place it)
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import EditThesisModal from "./EditThesisModal.jsx";
import "./admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TeacherThesisPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [previewItem, setPreviewItem] = useState(null);

  async function load() {
    setLoading(true);
    try {
      // ✅ TEACHER endpoint, not /api/admin
      const res = await fetch(`${API}/api/teacher/thesis?limit=500`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setItems(json.thesis || json);
      console.log(
        "[TEACHER][LOAD] Loaded thesis list:",
        (json.thesis || json)?.length ?? 0
      );
    } catch (e) {
      console.error("[TEACHER][LOAD][ERROR]", e);
      alert("Failed to load thesis list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function buildDownloadUrl(thesis) {
    if (!thesis?._id) return null;
    // public/thesis download endpoint stays the same
    return `${API}/api/publicProjects/${thesis._id}/download`;
  }

  async function updateStatus(id, next, extra = {}) {
    const prev = items.find((i) => i._id === id);
    console.log(
      `[TEACHER][STATUS][REQUEST] ${next.toUpperCase()} — id=${id}, title="${
        prev?.title
      }"`,
      extra
    );

    setBusyId(id);
    // optimistic UI
    setItems((list) =>
      list.map((i) => (i._id === id ? { ...i, status: next } : i))
    );

    try {
      // ✅ TEACHER endpoint for approve/reject (sends email in controller)
      const res = await fetch(`${API}/api/teacher/thesis/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next, ...extra }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data?.thesis?._id) {
        setItems((list) =>
          list.map((i) => (i._id === id ? data.thesis : i))
        );
      }

      console.log("[TEACHER][STATUS][SUCCESS]", {
        id,
        status: next,
        emailStatus: data?.emailStatus,
      });

      toast(
        `${next === "approved" ? "Approved" : "Rejected"} — email notification queued.`
      );
    } catch (e) {
      console.error("[TEACHER][STATUS][ERROR]", e);
      alert(`Failed to set status to "${next}". Reverting.`);
      setItems((list) => list.map((i) => (i._id === id ? prev : i)));
    } finally {
      setBusyId("");
    }
  }

  function onApprove(t) {
    if (!confirm(`Approve "${t.title}"?`)) return;
    updateStatus(t._id, "approved");
  }

  function onReject(t) {
    if (!confirm(`Reject "${t.title}"?`)) return;
    const reason =
      prompt("Optional: add a rejection reason (shown in the email):") ||
      undefined;
    updateStatus(t._id, "rejected", reason ? { reason } : {});
  }

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        const okStatus =
          status === "all" ? true : (i.status || "pending") === status;
        const text = `${i.title} ${i.category} ${i.year} ${(i.authors || []).join(
          " "
        )}`.toLowerCase();
        return okStatus && text.includes(q.toLowerCase());
      }),
    [items, q, status]
  );

  const previewUrl = previewItem ? buildDownloadUrl(previewItem) : null;

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">
        <div className="page-head">
          <div>
            <h1>Thesis</h1>
            <div className="sub">Approve, reject, edit, or view submissions</div>
          </div>
        </div>

        <div className="filters">
          <input
            className="input"
            placeholder="Search title, author, year…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 360 }}>Title</th>
              <th>Year</th>
              <th>Category</th>
              <th>Authors</th>
              <th>Status</th>
              <th style={{ width: 460 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t._id}
                className={busyId === t._id ? "row-busy" : ""}
              >
                <td>{t.title}</td>
                <td>{t.year || "—"}</td>
                <td>{t.category || "—"}</td>
                <td>{(t.authors || []).join(", ") || "—"}</td>
                <td>
                  <span className={`badge ${t.status || "pending"}`}>
                    {t.status || "pending"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btn success"
                    onClick={() => onApprove(t)}
                    disabled={busyId === t._id}
                    title="Approve and notify"
                  >
                    {busyId === t._id ? "Working…" : "Approve"}
                  </button>

                  <button
                    className="btn warn"
                    onClick={() => onReject(t)}
                    disabled={busyId === t._id}
                    title="Reject and notify"
                  >
                    Reject
                  </button>

                  <button
                    className="btn brand"
                    onClick={() => setEditItem(t)}
                    disabled={busyId === t._id}
                  >
                    Edit
                  </button>

                  <button
                    className="btn"
                    style={{ background: "#111827", color: "#fff" }}
                    onClick={() => {
                      const url = buildDownloadUrl(t);
                      if (!url) {
                        alert("No PDF available for this thesis.");
                        return;
                      }
                      window.open(url, "_blank", "noopener,noreferrer");
                      setPreviewItem(t);
                    }}
                    disabled={busyId === t._id}
                    title="View thesis PDF"
                  >
                    View PDF
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan="6">No results.</td>
              </tr>
            )}
          </tbody>
        </table>

        {editItem && (
          <EditThesisModal
            item={editItem}
            onClose={() => setEditItem(null)}
            onSaved={(updated) => {
              setItems((prev) =>
                prev.map((p) => (p._id === updated._id ? updated : p))
              );
              setEditItem(null);
              toast("Changes saved — email notification queued.");
            }}
          />
        )}

        {previewItem && previewUrl && (
          <div
            className="pdf-fullscreen-overlay"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "8px 16px",
                background: "#111",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {previewItem.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{
                  border: "none",
                  background: "#fff",
                  color: "#111",
                  borderRadius: 999,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <iframe
                title="Thesis PDF (Teacher Preview)"
                src={`${previewUrl}#toolbar=1`}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  background: "#333",
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Sidebar() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

  return (
    <aside className="admin-sidebar">
      <div className="brand">
        <span className="dot" /> Teacher Panel
      </div>
      <nav className="nav">
        <NavLink
          to="/teacher"
          end
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/teacher/thesis"
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          Thesis
        </NavLink>
      </nav>
      <div className="sidebar-spacer" />
      <button
        className="logout"
        onClick={() => {
          fetch(`${API}/api/auth/logoutUser`, {
            method: "POST",
            credentials: "include",
          }).finally(() => {
            window.location.href = "/login";
          });
        }}
      >
        Logout
      </button>
    </aside>
  );
}

// tiny toast
function toast(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #111; color: #fff; padding: 10px 14px; border-radius: 8px;
    font-size: 14px; box-shadow: 0 6px 20px rgba(0,0,0,.2); z-index: 9999;
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
  }, 1800);
  setTimeout(() => el.remove(), 2200);
}
