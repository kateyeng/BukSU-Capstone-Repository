// src/Teacher/Thesis.jsx
import { useEffect, useMemo, useState } from "react";
import EditThesisModal from "./EditThesisModal.jsx";
import Sidebar from "./Sidebar.jsx";
import "./teacher.css";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TeacherThesisPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [previewItem, setPreviewItem] = useState(null);

  // approve / reject / delete confirmation modal
  const [confirmData, setConfirmData] = useState(null);

  function buildDownloadUrl(thesis) {
    if (!thesis?._id) return null;
    return `${API}/api/publicProjects/${thesis._id}/download`;
  }

  /* ========== LOAD LIST ========== */
  async function load() {
    setLoading(true);
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
      toast.error("Failed to load thesis list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // polling so locks appear/disappear for others
  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  /* ========== STATUS UPDATE ========== */
  async function updateStatus(id, next, extra = {}) {
    const prev = items.find((i) => i._id === id);
    console.log(
      `[TEACHER][STATUS][REQUEST] ${next.toUpperCase()} — id=${id}, title="${prev?.title
      }"`,
      extra
    );

    setBusyId(id);

    // optimistic UI
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
        setItems((list) =>
          list.map((i) => (i._id === id ? data.thesis : i))
        );
      }

      console.log("[TEACHER][STATUS][SUCCESS]", {
        id,
        status: next,
        emailStatus: data?.emailStatus,
      });

      toast.success(
        `${next === "approved" ? "Approved" : "Rejected"} — email notification queued.`
      );
    } catch (e) {
      console.error("[TEACHER][STATUS][ERROR]", e);
      toast.error(`Failed to set status to "${next}". Reverting.`);
      setItems((list) => list.map((i) => (i._id === id ? prev : i)));
    } finally {
      setBusyId("");
    }
  }

  /* ========== DELETE THESIS ========== */
  async function deleteThesis(id) {
    console.log("[TEACHER][DELETE][REQUEST]", { id });

    const prevItems = items; // snapshot for revert
    setBusyId(id);

    // optimistic remove
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

  /* ========== LOCK HELPERS (client-side) ========== */

  // replicate the server's hasActiveLock logic
  function hasActiveLock(thesis) {
    const lock = thesis?.editLock;
    if (!lock) return false;
    if (lock.releasedAt) return false;
    if (lock.expiresAt && new Date(lock.expiresAt) < new Date()) return false;
    return true;
  }

  /* ========== LOCK / UNLOCK FOR EDITING (2PL) ========== */

  async function lockThesisForEdit(thesis) {
    try {
      setBusyId(thesis._id);

      const res = await fetch(
        `${API}/api/teacher/thesis/${thesis._id}/lock`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (res.status === 423) {
        toast.error("This thesis is currently being edited by someone else.");
        await load(); // refresh lock state
        return false;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      // Update local list with new lock info
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
      const res = await fetch(
        `${API}/api/teacher/thesis/${thesisId}/unlock`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.thesis?._id) {
        setItems((list) =>
          list.map((i) => (i._id === json.thesis._id ? json.thesis : i))
        );
      } else {
        // fallback: clear lock locally
        setItems((list) =>
          list.map((i) =>
            i._id === thesisId ? { ...i, editLock: undefined } : i
          )
        );
      }
    } catch (e) {
      console.error("[TEACHER][UNLOCK][ERROR]", e);
      // no toast here to avoid noise
    }
  }

  async function handleOpenEdit(thesis) {
    // if UI already sees an active lock, block right away
    if (hasActiveLock(thesis)) {
      toast.error("This thesis is currently being edited by someone else.");
      return;
    }

    const ok = await lockThesisForEdit(thesis);
    if (ok) {
      // use the latest version from state (with editLock) if available
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

  /* ========== APPROVE / REJECT / DELETE CONFIRMS ========== */
  function onApprove(thesis) {
    setConfirmData({ mode: "approve", thesis, reason: "" });
  }

  function onReject(thesis) {
    setConfirmData({ mode: "reject", thesis, reason: "" });
  }

  function onDelete(thesis) {
    setConfirmData({ mode: "delete", thesis, reason: "" });
  }

  async function handleConfirm() {
    if (!confirmData) return;
    const { mode, thesis, reason } = confirmData;

    if (mode === "approve") {
      await updateStatus(thesis._id, "approved");
    } else if (mode === "reject") {
      await updateStatus(
        thesis._id,
        "rejected",
        reason ? { reason } : {}
      );
    } else if (mode === "delete") {
      await deleteThesis(thesis._id);
    }

    setConfirmData(null);
  }

  function handleCancelConfirm() {
    setConfirmData(null);
  }

  /* ========== FILTERING ========== */
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

  /* ========== RENDER ========== */
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
            {filtered.map((t) => {
              const locked = hasActiveLock(t);

              return (
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
                    {locked && (
                      <span className="badge locked">Editing…</span>
                    )}
                  </td>

                  <td className="actions">
                    {locked ? (
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        Actions disabled – currently being edited
                      </span>
                    ) : (
                      <>
                        {/* Approve ✔ */}
                        <button
                          className="btn icon-box"
                          style={{ background: "#111827", color: "#fff" }}
                          onClick={() => onApprove(t)}
                          disabled={busyId === t._id}
                          title="Approve and notify"
                        >
                          ✔
                        </button>

                        {/* Reject ✖ */}
                        <button
                          className="btn icon-box"
                          style={{ background: "#111827", color: "#fff" }}
                          onClick={() => onReject(t)}
                          disabled={busyId === t._id}
                          title="Reject and notify"
                        >
                          ✖
                        </button>

                        {/* Edit ✎ */}
                        <button
                          className="btn icon-box"
                          style={{ background: "#111827", color: "#fff" }}
                          onClick={() => handleOpenEdit(t)}
                          disabled={busyId === t._id}
                          title="Edit thesis"
                        >
                          ✎
                        </button>

                        {/* View PDF 📄 */}
                        <button
                          className="btn icon-box"
                          style={{ background: "#111827", color: "#fff" }}
                          onClick={() => {
                            const url = buildDownloadUrl(t);
                            if (!url) {
                              toast.error("No PDF available for this thesis.");
                              return;
                            }
                            window.open(
                              url,
                              "_blank",
                              "noopener,noreferrer"
                            );
                            setPreviewItem(t);
                          }}
                          disabled={busyId === t._id}
                          title="View thesis PDF"
                        >
                          📄
                        </button>

                        {/* Delete 🗑 */}
                        <button
                          className="btn icon-box"
                          style={{ background: "#b91c1c", color: "#fff" }}
                          onClick={() => onDelete(t)}
                          disabled={busyId === t._id}
                          title="Delete thesis"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan="6">No results.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Edit modal */}
        {editItem && (
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

        {/* Fullscreen PDF preview */}
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

        {/* Confirm approve / reject / delete modal (white background) */}
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
                    ? `Are you sure you want to approve `
                    : confirmData.mode === "reject"
                      ? `Are you sure you want to reject `
                      : `Are you sure you want to delete `}
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
