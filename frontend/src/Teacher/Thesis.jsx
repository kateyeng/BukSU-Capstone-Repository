import { useEffect, useMemo, useState } from "react";
import EditThesisModal from "./EditThesisModal.jsx";
import Sidebar from "./Sidebar.jsx";
import CommentSection from "./CommentSection.jsx";
import "./teacher.css";
import toast from "react-hot-toast";
import usePermissions from "../hooks/usePermissions";
import api from "../api/axios.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TeacherThesisPage() {
  const { can } = usePermissions();
  const [currentUser, setCurrentUser] = useState(null);

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [editItem, setEditItem] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  // Fetch current user on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/auth/me");
        if (res.data) setCurrentUser(res.data);
      } catch (e) {
        console.error("[TEACHER][FETCH_USER][ERROR]", e);
      }
    })();
  }, []);

  function buildDownloadUrl(thesis) {
    if (!thesis?._id) return null;
    return `${API}/api/publicProjects/${thesis._id}/download`;
  }

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
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
      if (!silent) toast.error("Failed to load thesis list.");
    } finally {
      if (!silent) setLoading(false);
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

  useEffect(() => {
    if (!can.thesisView) return;
    const id = setInterval(() => load(true), 5000);
    return () => clearInterval(id);
  }, [can.thesisView]);

  async function updateStatus(id, next, extra = {}) {
    const prev = items.find((i) => i._id === id);
    console.log(
      `[TEACHER][STATUS][REQUEST] ${next.toUpperCase()} — id=${id}, title="${prev?.title}"`,
      extra
    );

    setBusyId(id);

    setItems((list) =>
      list.map((i) => (i._id === id ? { ...i, status: next } : i))
    );

    try {
      const res = await fetch(`${API}/api/teacher/thesis/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next, ...extra }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data?.thesis?._id) {
        setItems((list) => list.map((i) => (i._id === id ? data.thesis : i)));
      }

      toast.success(
        `${
          next === "approved" ? "Approved" : "Rejected"
        } — email notification queued.`
      );
    } catch (e) {
      console.error("[TEACHER][STATUS][ERROR]", e);
      toast.error(`Failed to set status to "${next}". Reverting.`);
      setItems((list) => list.map((i) => (i._id === id ? prev : i)));
    } finally {
      setBusyId("");
    }
  }

  async function deleteThesis(id) {
    const prevItems = items;
    setBusyId(id);

    setItems((list) => list.filter((i) => i._id !== id));

    try {
      const res = await fetch(`${API}/api/teacher/thesis/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success("Thesis deleted.");
    } catch (e) {
      console.error("[TEACHER][DELETE][ERROR]", e);
      toast.error("Failed to delete thesis. Reverting.");
      setItems(() => prevItems);
    } finally {
      setBusyId("");
    }
  }

  function toggleSelect(id) {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
  }

  function selectAll() {
    setSelected(new Set(filtered.map((i) => i._id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function bulkApprove() {
    if (selected.size === 0) {
      toast.error("Select theses to approve");
      return;
    }

    const ids = Array.from(selected);
    setBusyId("bulk");

    try {
      const res = await fetch(`${API}/api/teacher/thesis/bulk/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      toast.success(`Approved ${data.count} thesis`);
      setSelected(new Set());
      await load();
    } catch (e) {
      console.error("[BULK APPROVE ERROR]", e);
      toast.error("Failed to bulk approve");
    } finally {
      setBusyId("");
    }
  }

  async function bulkReject() {
    if (selected.size === 0) {
      toast.error("Select theses to reject");
      return;
    }

    const ids = Array.from(selected);
    setBusyId("bulk");

    try {
      const res = await fetch(`${API}/api/teacher/thesis/bulk/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      toast.success(`Rejected ${data.count} thesis`);
      setSelected(new Set());
      await load();
    } catch (e) {
      console.error("[BULK REJECT ERROR]", e);
      toast.error("Failed to bulk reject");
    } finally {
      setBusyId("");
    }
  }

  function hasActiveLock(thesis) {
    const lock = thesis?.editLock;
    if (!lock) return false;
    if (lock.releasedAt) return false;
    if (lock.expiresAt && new Date(lock.expiresAt) < new Date()) return false;
    return true;
  }

  async function lockThesisForEdit(thesis) {
    try {
      setBusyId(thesis._id);

      const res = await fetch(`${API}/api/teacher/thesis/${thesis._id}/lock`, {
        method: "POST",
        credentials: "include",
      });

      if (res.status === 423) {
        toast.error("This thesis is currently being edited by someone else.");
        await load();
        return false;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      if (json?.thesis?._id) {
        setItems((list) =>
          list.map((i) => (i._id === json.thesis._id ? json.thesis : i))
        );
      }

      return true;
    } catch (e) {
      console.error("[TEACHER][LOCK][ERROR]", e);
      toast.error("Failed to acquire edit lock.");
      return false;
    } finally {
      setBusyId("");
    }
  }

  async function unlockThesisForEdit(thesisId) {
    try {
      const res = await fetch(`${API}/api/teacher/thesis/${thesisId}/unlock`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      if (json?.thesis?._id) {
        setItems((list) =>
          list.map((i) => (i._id === json.thesis._id ? json.thesis : i))
        );
      } else {
        setItems((list) =>
          list.map((i) =>
            i._id === thesisId ? { ...i, editLock: undefined } : i
          )
        );
      }
    } catch (e) {
      console.error("[TEACHER][UNLOCK][ERROR]", e);
    }
  }

  async function handleOpenEdit(thesis) {
    if (!can.thesisEdit) {
      toast.error("Edit permission is disabled by admin.");
      return;
    }

    if (hasActiveLock(thesis)) {
      toast.error("This thesis is currently being edited by someone else.");
      return;
    }

    const ok = await lockThesisForEdit(thesis);
    if (ok) {
      setEditItem(() => {
        const latest = items.find((i) => i._id === thesis._id);
        return latest || thesis;
      });
    }
  }

  async function handleCloseEdit() {
    if (editItem) {
      await unlockThesisForEdit(editItem._id);
    }
    setEditItem(null);
  }

  function onApprove(thesis) {
    if (!can.thesisApprove) {
      toast.error("Approve permission is disabled by admin.");
      return;
    }
    setConfirmData({ mode: "approve", thesis, reason: "" });
  }

  function onReject(thesis) {
    if (!can.thesisReject) {
      toast.error("Reject permission is disabled by admin.");
      return;
    }
    setConfirmData({ mode: "reject", thesis, reason: "" });
  }

  function onDelete(thesis) {
    if (!can.projectDelete) {
      toast.error("Delete permission is disabled by admin.");
      return;
    }
    setConfirmData({ mode: "delete", thesis, reason: "" });
  }

  async function handleConfirm() {
    if (!confirmData) return;
    const { mode, thesis, reason } = confirmData;

    if (mode === "approve") {
      await updateStatus(thesis._id, "approved");
    } else if (mode === "reject") {
      await updateStatus(thesis._id, "rejected", reason ? { reason } : {});
    } else if (mode === "delete") {
      await deleteThesis(thesis._id);
    }

    setConfirmData(null);
  }

  function handleCancelConfirm() {
    setConfirmData(null);
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
    <div className="admin-shell" style={{ background: "#ffffff" }}>
      <Sidebar />
      <main className="admin-main" style={{ background: "#ffffff" }}>
        <div className="page-head">
          <div>
            <h1>Thesis</h1>
            <div className="sub">
              Approve, reject, edit, delete, or view submissions
            </div>
          </div>
        </div>

        {!can.thesisView ? (
          <div className="card">
            <div className="label">Access Restricted</div>
            <div style={{ marginTop: 10, color: "#92400e", fontSize: 14 }}>
              Thesis access is currently disabled by admin.
            </div>
          </div>
        ) : (
          <>
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

            {selected.size > 0 && can.thesisApprove && (
              <div
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #86efac",
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 16,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {selected.size} selected
                </span>
                <button
                  className="btn"
                  onClick={bulkApprove}
                  disabled={busyId === "bulk"}
                  style={{ background: "#059669", color: "#fff" }}
                >
                  ✔ Approve All
                </button>
                <button
                  className="btn"
                  onClick={bulkReject}
                  disabled={busyId === "bulk"}
                  style={{ background: "#dc2626", color: "#fff" }}
                >
                  ✖ Reject All
                </button>
                <button
                  className="btn"
                  onClick={deselectAll}
                  disabled={busyId === "bulk"}
                  style={{ background: "#9ca3af", color: "#fff" }}
                >
                  Clear
                </button>
              </div>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>
                    {filtered.length > 0 && (
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) selectAll();
                          else deselectAll();
                        }}
                      />
                    )}
                  </th>
                  <th style={{ width: 360 }}>Title</th>
                  <th>Year</th>
                  <th>Category</th>
                  <th>Authors</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const locked = hasActiveLock(t);
                  const thesisStatus = t.status || "pending";
                  const isPending = thesisStatus === "pending";

                  return (
                    <tr
                      key={t._id}
                      className={busyId === t._id ? "row-busy" : ""}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(t._id)}
                          onChange={() => toggleSelect(t._id)}
                          disabled={!isPending}
                        />
                      </td>
                      <td>{t.title}</td>
                      <td>{t.year || "—"}</td>
                      <td>{t.category || "—"}</td>
                      <td>{(t.authors || []).join(", ") || "—"}</td>
                      <td>
                        <span className={`badge ${thesisStatus}`}>
                          {thesisStatus}
                        </span>
                        {locked && (
                          <span className="badge locked">Editing…</span>
                        )}
                      </td>

                      <td>
                        {locked ? (
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>
                            Actions disabled – currently being edited
                          </span>
                        ) : (
                          <div className="actions actions-tight">
                            {can.thesisApprove && isPending && (
                              <button
                                className="btn icon-box"
                                onClick={() => onApprove(t)}
                                disabled={busyId === t._id}
                                title="Approve and notify"
                              >
                                ✔
                              </button>
                            )}

                            {can.thesisReject && isPending && (
                              <button
                                className="btn icon-box"
                                onClick={() => onReject(t)}
                                disabled={busyId === t._id}
                                title="Reject and notify"
                              >
                                ✖
                              </button>
                            )}

                            {can.thesisEdit && (
                              <button
                                className="btn icon-box"
                                onClick={() => handleOpenEdit(t)}
                                disabled={busyId === t._id}
                                title="Edit thesis"
                              >
                                ✎
                              </button>
                            )}

                            {can.projectDownload && (
                              <button
                                className="btn icon-box"
                                onClick={() => {
                                  const url = buildDownloadUrl(t);
                                  if (!url) {
                                    toast.error("No PDF available for this thesis.");
                                    return;
                                  }
                                  window.open(url, "_blank", "noopener,noreferrer");
                                  setPreviewItem(t);
                                }}
                                disabled={busyId === t._id}
                                title="View thesis PDF"
                              >
                                📄
                              </button>
                            )}

                            {can.thesisView && (
                              <button
                                className="btn icon-box"
                                onClick={() => {
                                  window.location.href = "/teacher/activity";
                                }}
                                disabled={busyId === t._id}
                                title="Open activity history"
                              >
                                ⏱
                              </button>
                            )}

                            {can.projectDelete && (
                              <button
                                className="btn icon-box danger"
                                onClick={() => onDelete(t)}
                                disabled={busyId === t._id}
                                title="Delete thesis"
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!filtered.length && (
                  <tr>
                    <td colSpan="7">No results.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {editItem && can.thesisEdit && (
          <EditThesisModal
            item={editItem}
            onClose={handleCloseEdit}
            onSaved={async (updated) => {
              setItems((prev) =>
                prev.map((p) => (p._id === updated._id ? updated : p))
              );
              toast.success("Changes saved — email notification queued.");
              await unlockThesisForEdit(updated._id);
              setEditItem(null);
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

            <div style={{ flex: 1, display: "flex", gap: 0 }}>
              <div style={{ flex: 2, minWidth: 0 }}>
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
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "#fff",
                  borderLeft: "1px solid #e5e7eb",
                  overflowY: "auto",
                  padding: "16px",
                }}
              >
                <CommentSection
                  projectId={previewItem?._id}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>
        )}

        {confirmData && (
          <div className="modal-backdrop" onClick={handleCancelConfirm}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 420 }}
            >
              <header>
                <strong>
                  {confirmData.mode === "approve"
                    ? "Approve Thesis"
                    : confirmData.mode === "reject"
                    ? "Reject Thesis"
                    : "Delete Thesis"}
                </strong>
                <button className="btn" onClick={handleCancelConfirm}>
                  Close
                </button>
              </header>

              <div className="content">
                <p style={{ marginBottom: 12, fontSize: 14 }}>
                  {confirmData.mode === "approve"
                    ? "Are you sure you want to approve "
                    : confirmData.mode === "reject"
                    ? "Are you sure you want to reject "
                    : "Are you sure you want to delete "}
                  <strong>"{confirmData.thesis.title}"</strong>?
                </p>

                {confirmData.mode === "delete" && (
                  <p
                    style={{
                      marginTop: -4,
                      marginBottom: 12,
                      fontSize: 12,
                      color: "#b91c1c",
                    }}
                  >
                    This action cannot be undone.
                  </p>
                )}

                {confirmData.mode === "reject" && (
                  <div className="row">
                    <label className="label-sm">
                      Rejection reason (optional, shown in email)
                    </label>
                    <textarea
                      className="field"
                      rows={4}
                      value={confirmData.reason}
                      onChange={(e) =>
                        setConfirmData((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              <footer>
                <button className="btn" onClick={handleCancelConfirm}>
                  Cancel
                </button>
                <button className="btn primary" onClick={handleConfirm}>
                  {confirmData.mode === "approve"
                    ? "Approve"
                    : confirmData.mode === "reject"
                    ? "Reject"
                    : "Delete"}
                </button>
              </footer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}