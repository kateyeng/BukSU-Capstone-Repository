// src/Admin/AdminEditCapstoneModal.jsx
import { useState } from "react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminEditCapstoneModal({ item, onClose, onSaved }) {
    const [title, setTitle] = useState(item?.title || "");
    const [category, setCategory] = useState(item?.category || "");
    const [year, setYear] = useState(item?.year || "");
    const [authors, setAuthors] = useState((item?.authors || []).join(", "));
    const [adviser, setAdviser] = useState(item?.adviser || "");
    const [department, setDepartment] = useState(item?.department || "");
    const [abstract, setAbstract] = useState(item?.abstract || "");
    const [keywords, setKeywords] = useState((item?.tags || []).join(", "));

    const [saving, setSaving] = useState(false);

    async function handleSave(e) {
        e.preventDefault();
        if (!item?._id) return;

        setSaving(true);

        try {
            const body = {
                title,
                category,
                year,
                abstract,
                authors,
                adviser,
                department,
                keywords,
            };

            // Adjust endpoint if your backend uses a different route
            const res = await fetch(`${API}/api/admin/thesis/${item._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const updated = await res.json();
            toast.success("Capstone updated.");
            onSaved?.(updated);
        } catch (err) {
            console.error("[ADMIN][EDIT_CAPSTONE][ERROR]", err);
            toast.error("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="modal-backdrop"
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.55)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
            }}
            onClick={onClose}
        >
            <div
                className="modal"
                style={{
                    maxWidth: 860,
                    width: "100%",
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <header
                    style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <strong>Edit Capstone / Thesis</strong>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            fontSize: 13,
                            padding: "4px 8px",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </header>

                <form onSubmit={handleSave}>
                    <div
                        style={{
                            padding: "16px 20px",
                            maxHeight: "60vh",
                            overflowY: "auto",
                        }}
                    >
                        {/* TITLE */}
                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.04,
                                    color: "#6b7280",
                                    display: "block",
                                    marginBottom: 4,
                                }}
                            >
                                Title
                            </label>
                            <input
                                className="field"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #d1d5db",
                                    fontSize: 14,
                                }}
                            />
                        </div>

                        {/* CATEGORY + YEAR */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1.5fr 1fr",
                                gap: 12,
                                marginBottom: 12,
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.04,
                                        color: "#6b7280",
                                        display: "block",
                                        marginBottom: 4,
                                    }}
                                >
                                    Category
                                </label>
                                <input
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        fontSize: 14,
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.04,
                                        color: "#6b7280",
                                        display: "block",
                                        marginBottom: 4,
                                    }}
                                >
                                    Year
                                </label>
                                <input
                                    type="number"
                                    min="1900"
                                    max="3000"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        fontSize: 14,
                                    }}
                                />
                            </div>
                        </div>

                        {/* AUTHORS */}
                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.04,
                                    color: "#6b7280",
                                    display: "block",
                                    marginBottom: 4,
                                }}
                            >
                                Authors (comma-separated)
                            </label>
                            <input
                                value={authors}
                                onChange={(e) => setAuthors(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #d1d5db",
                                    fontSize: 14,
                                }}
                            />
                        </div>

                        {/* ADVISER + DEPARTMENT */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1.2fr 1.2fr",
                                gap: 12,
                                marginBottom: 12,
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.04,
                                        color: "#6b7280",
                                        display: "block",
                                        marginBottom: 4,
                                    }}
                                >
                                    Adviser
                                </label>
                                <input
                                    value={adviser}
                                    onChange={(e) => setAdviser(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        fontSize: 14,
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.04,
                                        color: "#6b7280",
                                        display: "block",
                                        marginBottom: 4,
                                    }}
                                >
                                    Department
                                </label>
                                <input
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        fontSize: 14,
                                    }}
                                />
                            </div>
                        </div>

                        {/* KEYWORDS */}
                        <div style={{ marginBottom: 12 }}>
                            <label
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.04,
                                    color: "#6b7280",
                                    display: "block",
                                    marginBottom: 4,
                                }}
                            >
                                Keywords (comma-separated)
                            </label>
                            <input
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #d1d5db",
                                    fontSize: 14,
                                }}
                            />
                        </div>

                        {/* ABSTRACT */}
                        <div style={{ marginBottom: 4 }}>
                            <label
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.04,
                                    color: "#6b7280",
                                    display: "block",
                                    marginBottom: 4,
                                }}
                            >
                                Abstract
                            </label>
                            <textarea
                                value={abstract}
                                onChange={(e) => setAbstract(e.target.value)}
                                rows={5}
                                style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #d1d5db",
                                    fontSize: 14,
                                    resize: "vertical",
                                }}
                            />
                        </div>
                    </div>

                    <footer
                        style={{
                            padding: "10px 20px",
                            borderTop: "1px solid #e5e7eb",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            style={{
                                borderRadius: 999,
                                border: "1px solid #d1d5db",
                                padding: "6px 14px",
                                fontSize: 13,
                                background: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                borderRadius: 999,
                                border: "none",
                                padding: "6px 16px",
                                fontSize: 13,
                                fontWeight: 500,
                                background: "#111827",
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            {saving ? "Saving…" : "Save changes"}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
