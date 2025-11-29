// src/Teacher/Activity.jsx
import { useEffect, useMemo, useState } from "react";
import "./teacher.css";
// src/teacher/Activity.jsx
import Sidebar from "/Sidebar.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Activity({ onLogout }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [printing, setPrinting] = useState(false); // when true → show ALL rows

    const PAGE_SIZE = 10;

    // ================= LOAD DATA =================
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
        load();
    }, []);

    // ================= HELPERS =================
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

    // approved only + search
    const approvedAndFiltered = useMemo(() => {
        const lower = q.toLowerCase();
        return items
            .filter((t) => (t.status || "pending") === "approved")
            .filter((t) => {
                if (!lower) return true;
                const text = [
                    t.title,
                    t.category,
                    t.year,
                    t.abstract,
                    ...(t.authors || []),
                    t.adviser,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return text.includes(lower);
            })
            .sort((a, b) => {
                const aT = new Date(a.createdAt || 0).getTime();
                const bT = new Date(b.createdAt || 0).getTime();
                return bT - aT;
            });
    }, [items, q]);

    const totalApproved = approvedAndFiltered.length;
    const totalPages = Math.max(1, Math.ceil(totalApproved / PAGE_SIZE));

    useEffect(() => {
        setPage((p) => {
            const maxPage = Math.max(1, Math.ceil(totalApproved / PAGE_SIZE));
            return Math.min(p, maxPage);
        });
    }, [totalApproved]);

    // rows for table
    const rows = useMemo(() => {
        if (printing) return approvedAndFiltered; // all rows when printing
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return approvedAndFiltered.slice(start, end);
    }, [approvedAndFiltered, page, printing]);

    // ================= GENERATE PDF =================
    function handleGeneratePdf() {
        setPrinting(true); // show all rows

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
                            List of all <strong>approved</strong> thesis with timestamps
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btn" onClick={load} disabled={loading}>
                            {loading ? "Loading…" : "Refresh"}
                        </button>
                        <button className="btn brand" onClick={handleGeneratePdf}>
                            Generate PDF
                        </button>
                    </div>
                </div>

                <div className="filters">
                    <input
                        className="input"
                        placeholder="Search title, category, author, adviser…"
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setPage(1);
                        }}
                    />
                    <div className="hint">
                        Showing {rows.length} of {totalApproved} approved thesis
                    </div>
                </div>

                {/* SINGLE CARD THAT WE PRINT (from this title downwards) */}
                <div className="card activity-print-area">
                    <div className="label">Approved Thesis Activity</div>
                    <p className="small">Generated at: {nowText}</p>

                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 260 }}>Title</th>
                                <th>Category</th>
                                <th>Year</th>
                                <th>Adviser / Authors</th>
                                <th>Created At</th>
                                <th>Updated At</th>
                                {!printing && <th style={{ width: 110 }}>PDF</th>}
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
                                            <div>
                                                {t.adviser && (
                                                    <div className="small">Adviser: {t.adviser}</div>
                                                )}
                                                {(t.authors || []).length > 0 && (
                                                    <div className="small">
                                                        Authors: {(t.authors || []).join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>{created}</td>
                                        <td>{updated}</td>
                                        {!printing && (
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
                                    <td colSpan={printing ? 6 : 7}>No approved thesis found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination (hide while printing) */}
                    {!printing && totalApproved > PAGE_SIZE && (
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
                                onClick={() =>
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
