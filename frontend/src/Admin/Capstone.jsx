// src/Admin/Capstone.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import EditThesisModal from "../Teacher/EditThesisModal.jsx"; // <-- change path/name if needed

export default function Capstone({ currentUser = null }) {
    const [items, setItems] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // lock / edit state
    const [busyId, setBusyId] = useState(null);
    const [editing, setEditing] = useState(null);

    // admin identity (for lock comparison + UI pills)
    const [me, setMe] = useState(currentUser);
    const myId = me?._id || currentUser?._id || null;

    /* ===== LOAD CURRENT ADMIN (if not passed as prop) ===== */
    useEffect(() => {
        if (currentUser) {
            setMe(currentUser);
            return;
        }

        let abort = false;
        async function loadMe() {
            try {
                const res = await api.get("/api/auth/me", { withCredentials: true });
                if (!abort) {
                    const user = res.data?.user || res.data;
                    setMe(user);
                }
            } catch (e) {
                console.error("[ADMIN][ME][ERROR]", e);
            }
        }

        loadMe();
        return () => {
            abort = true;
        };
    }, [currentUser]);

    /* ===== LOAD THESIS LIST ===== */
    async function loadThesis() {
        try {
            setLoading(true);
            setErr("");

            const res = await api.get("/api/admin/thesis", {
                withCredentials: true,
            });

            const data = res.data;
            const list = data?.thesis || data?.projects || data || [];

            setItems(list);
        } catch (e) {
            setErr(
                e?.response?.data?.message ||
                e?.message ||
                "Failed to load capstone list."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadThesis();
    }, []);

    // poll so locks appear/disappear without manual refresh
    useEffect(() => {
        const id = setInterval(loadThesis, 5000);
        return () => clearInterval(id);
    }, []);

    // reset to first page when filter/search changes
    useEffect(() => {
        setPage(1);
    }, [statusFilter, search]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return items.filter((p) => {
            const matchStatus =
                statusFilter === "all" ||
                (p.status || "").toLowerCase() === statusFilter;

            if (!term) return matchStatus;

            const authorsText = Array.isArray(p.authors)
                ? p.authors.join(" ")
                : p.authors || "";

            const haystack = `${p.title || ""} ${p.category || ""} ${authorsText}`
                .toLowerCase()
                .trim();

            return matchStatus && haystack.includes(term);
        });
    }, [items, statusFilter, search]);

    // pagination slices
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const current = filtered.slice(startIdx, startIdx + pageSize);

    const formatDate = (value) => {
        if (!value) return "—";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    /* ===== 2-PL: ADMIN LOCK / UNLOCK (shared with teachers) ===== */

    async function lockForEdit(project) {
        try {
            setBusyId(project._id);

            // use the same teacher lock endpoint; it allows role "admin"
            const res = await api.post(
                `/api/teacher/thesis/${project._id}/lock`,
                {},
                { withCredentials: true }
            );

            if (res.status === 423) {
                toast.error("This thesis is currently being edited by someone else.");
                await loadThesis();
                return false;
            }

            const doc = res.data?.thesis || res.data?.project || res.data;
            if (doc?._id) {
                setItems((list) => list.map((p) => (p._id === doc._id ? doc : p)));
            }

            return true;
        } catch (e) {
            console.error("[ADMIN][LOCK][ERROR]", e);
            toast.error("Failed to acquire edit lock.");
            return false;
        } finally {
            setBusyId(null);
        }
    }

    async function unlockForEdit(id) {
        try {
            await api.post(
                `/api/teacher/thesis/${id}/unlock`,
                {},
                { withCredentials: true }
            );
            // refresh lock state
            await loadThesis();
        } catch (e) {
            console.error("[ADMIN][UNLOCK][ERROR]", e);
            // no toast; lock will eventually expire
        }
    }

    /* ===== ACTION HANDLERS ===== */

    const handleApprove = (project) => {
        console.log("approve", project._id);
        // TODO: call API to approve
    };

    const handleReject = (project) => {
        console.log("reject", project._id);
        // TODO: call API to reject
    };

    const handleEdit = async (project) => {
        const ok = await lockForEdit(project);
        if (ok) {
            setEditing(project);
        }
    };

    const handleViewMeta = (project) => {
        console.log("view meta", project._id);
        // optional extra modal
    };

    const handleViewPdf = (project) => {
        const url = project.fileUrl || project.pdfUrl || project.documentUrl;
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="capstone-page">
            {/* Top bar */}
            <div className="capstone-header">
                <div>
                    <h2 className="capstone-title">Capstone / Thesis</h2>
                    <p className="capstone-subtitle">
                        View all uploaded thesis and capstone projects across departments.
                    </p>
                </div>

                <div className="capstone-header-actions">
                    <input
                        type="text"
                        placeholder="Search by title or author..."
                        className="capstone-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="capstone-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Error */}
            {err && <div className="capstone-alert capstone-alert-error">{err}</div>}

            {/* Loading / table */}
            {loading ? (
                <div className="capstone-loading">Loading thesis...</div>
            ) : (
                <>
                    <div className="capstone-table-wrapper">
                        {filtered.length === 0 ? (
                            <div className="capstone-empty">
                                <p>No thesis found with the current filter.</p>
                            </div>
                        ) : (
                            <table className="capstone-table">
                                <thead>
                                    <tr>
                                        <th>TITLE &amp; CATEGORY</th>
                                        <th>AUTHORS</th>
                                        <th>ADVISER</th>
                                        <th>DEPARTMENT</th>
                                        <th>YEAR</th>
                                        <th>STATUS</th>
                                        <th>UPLOADED</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {current.map((p) => {
                                        const lock = p.editLock;
                                        const isLockedByOther =
                                            lock &&
                                            lock.lockedBy &&
                                            myId &&
                                            String(lock.lockedBy) !== String(myId);

                                        return (
                                            <tr key={p._id}>
                                                <td>
                                                    <div className="capstone-title-cell">
                                                        <div className="capstone-project-title">
                                                            {p.title || "Untitled"}
                                                        </div>
                                                        <div className="capstone-project-category">
                                                            {p.category || "—"}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="capstone-authors">
                                                        {Array.isArray(p.authors) && p.authors.length > 0
                                                            ? p.authors.map((a, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="capstone-author-pill"
                                                                >
                                                                    {a}
                                                                </span>
                                                            ))
                                                            : "—"}
                                                    </div>
                                                </td>

                                                <td>{p.adviser || "—"}</td>
                                                <td>{p.department || "—"}</td>
                                                <td>{p.year || "—"}</td>

                                                <td>
                                                    <span
                                                        className={
                                                            "status-pill " +
                                                            (p.status
                                                                ? `status-pill-${p.status.toLowerCase()}`
                                                                : "status-pill-pending")
                                                        }
                                                    >
                                                        {p.status ? p.status.toUpperCase() : "PENDING"}
                                                    </span>
                                                    {isLockedByOther && (
                                                        <span className="capstone-lock-pill">
                                                            Editing…
                                                        </span>
                                                    )}
                                                </td>

                                                <td>{formatDate(p.createdAt)}</td>

                                                <td>
                                                    <div className="capstone-actions">
                                                        <button
                                                            className="capstone-action-btn"
                                                            title="Approve"
                                                            onClick={() => handleApprove(p)}
                                                            disabled={busyId === p._id}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className="capstone-action-btn"
                                                            title="Reject"
                                                            onClick={() => handleReject(p)}
                                                            disabled={busyId === p._id}
                                                        >
                                                            ✕
                                                        </button>
                                                        <button
                                                            className="capstone-action-btn"
                                                            title="Edit"
                                                            onClick={() => handleEdit(p)}
                                                            disabled={busyId === p._id}
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            className="capstone-action-btn"
                                                            title={
                                                                p.fileUrl || p.pdfUrl || p.documentUrl
                                                                    ? "View PDF"
                                                                    : "No file"
                                                            }
                                                            onClick={() => handleViewPdf(p)}
                                                            disabled={
                                                                busyId === p._id ||
                                                                !(
                                                                    p.fileUrl ||
                                                                    p.pdfUrl ||
                                                                    p.documentUrl
                                                                )
                                                            }
                                                        >
                                                            📄
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination footer */}
                    {filtered.length > 0 && (
                        <div className="capstone-pagination">
                            <div className="capstone-pagination-left">
                                <span>
                                    Rows per page:
                                    <select
                                        value={pageSize}
                                        onChange={(e) =>
                                            setPageSize(Number(e.target.value) || 10)
                                        }
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={15}>15</option>
                                        <option value={20}>20</option>
                                    </select>
                                </span>
                                <span className="capstone-pagination-count">
                                    {filtered.length === 0
                                        ? "0"
                                        : `${startIdx + 1}–${Math.min(
                                            startIdx + pageSize,
                                            filtered.length
                                        )}`}{" "}
                                    of {filtered.length}
                                </span>
                            </div>

                            <div className="capstone-pagination-right">
                                <button
                                    className="capstone-page-btn"
                                    disabled={safePage <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    ‹
                                </button>
                                <span className="capstone-page-indicator">
                                    Page {safePage} of {totalPages}
                                </span>
                                <button
                                    className="capstone-page-btn"
                                    disabled={safePage >= totalPages}
                                    onClick={() =>
                                        setPage((p) => Math.min(totalPages, p + 1))
                                    }
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Admin edit modal + unlock logic */}
            {editing && (
                <EditThesisModal
                    item={editing}
                    onClose={async () => {
                        await unlockForEdit(editing._id);
                        setEditing(null);
                    }}
                    onSaved={async (updated) => {
                        setItems((prev) =>
                            prev.map((p) => (p._id === updated._id ? updated : p))
                        );
                        toast.success("Changes saved — email notification queued.");
                        await unlockForEdit(updated._id);
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}
