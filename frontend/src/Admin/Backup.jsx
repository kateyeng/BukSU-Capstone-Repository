// src/Admin/Backup.jsx
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import "./admin.css";
import toast from "react-hot-toast";

function formatSize(bytes) {
    if (!bytes && bytes !== 0) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Small helper to show a confirm dialog using react-hot-toast
function confirmToast(message) {
    return new Promise((resolve) => {
        const toastId = toast.custom(
            (t) => (
                <div className="backup-confirm-toast">
                    <div className="backup-confirm-header">Confirm action</div>
                    <p className="backup-confirm-message">{message}</p>
                    <div className="backup-confirm-actions">
                        <button
                            className="backup-confirm-btn backup-confirm-yes"
                            onClick={() => {
                                toast.dismiss(toastId);
                                resolve(true);
                            }}
                        >
                            Yes, continue
                        </button>
                        <button
                            className="backup-confirm-btn backup-confirm-no"
                            onClick={() => {
                                toast.dismiss(toastId);
                                resolve(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
            }
        );
    });
}


export default function Backup() {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    // 🔄 Load backup history
    async function fetchBackups() {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/api/admin/backups");
            setBackups(res.data.backups || []);
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message ||
                "Failed to load backup history.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBackups();
    }, []);

    // 🟣 Create new backup
    async function handleCreateBackup() {
        try {
            setCreating(true);
            setError("");
            const res = await api.post("/api/admin/backup");

            if (res.data.backup) {
                setBackups((prev) => [res.data.backup, ...prev]);
            } else {
                await fetchBackups();
            }

            toast.success("Backup created and stored locally.");
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.status === 404
                    ? "Backup route not found. Check your backend /api/admin/backup."
                    : err.response?.data?.message || "Failed to create backup.";
            setError(msg);
            toast.error(msg);
        } finally {
            setCreating(false);
        }
    }

    // 🟡 Restore
    async function handleRestore(backupId) {
        const ok = await confirmToast(
            "Restoring will REPLACE current database data with this backup. Continue?"
        );
        if (!ok) return;

        try {
            setError("");
            await api.post(`/api/admin/backups/${backupId}/restore`);
            toast.success("Database restored from backup.");
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Failed to restore backup.";
            setError(msg);
            toast.error(msg);
        }
    }

    // ⬇️ Download
    async function handleDownload(backup) {
        try {
            const res = await api.get(
                `/api/admin/backups/${backup._id}/download`,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = backup.fileName || "backup.gz";
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Backup download started.");
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Failed to download backup.";
            setError(msg);
            toast.error(msg);
        }
    }

    // 🗑 Delete
    async function handleDelete(backupId) {
        const ok = await confirmToast(
            "Delete this backup file permanently?"
        );
        if (!ok) return;

        try {
            setError("");
            await api.delete(`/api/admin/backups/${backupId}`);
            setBackups((prev) => prev.filter((b) => b._id !== backupId));
            toast.success("Backup deleted.");
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Failed to delete backup.";
            setError(msg);
            toast.error(msg);
        }
    }

    return (
        <div className="backup-page">
            {/* 🚨 Important Info Banner */}
            <section className="backup-alert">
                <div className="backup-alert-icon">!</div>
                <div>
                    <h2>Important Information</h2>
                    <p>
                        Restoring a backup will replace <strong>all</strong>{" "}
                        current data. Always create a new backup before
                        restoring to prevent data loss.
                    </p>
                </div>
            </section>

            {/* 🟪 Create Backup Section */}
            <section className="backup-card backup-create-card">
                <div className="backup-card-header">
                    <div>
                        <h2>Create New Backup</h2>
                        <p>
                            Generates a complete backup using MongoDB&apos;s
                            mongodump utility.
                        </p>
                    </div>
                </div>

                <button
                    className="backup-primary-btn"
                    onClick={handleCreateBackup}
                    disabled={creating}
                >
                    {creating ? "Creating Backup..." : "Create Backup Now"}
                </button>
            </section>

            {/* 📁 Backup History */}
            <section className="backup-card backup-history-card">
                <div className="backup-card-header">
                    <h2>Backup History</h2>
                    <button
                        className="backup-ghost-btn"
                        onClick={fetchBackups}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {error && (
                    <div className="backup-error">
                        <span>{error}</span>
                    </div>
                )}

                <div className="backup-table-wrapper">
                    <table className="backup-table">
                        <thead>
                            <tr>
                                <th>Created</th>
                                <th>Size</th>
                                <th>Database</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {backups.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="backup-empty">
                                        No backups yet. Create your first backup
                                        above.
                                    </td>
                                </tr>
                            )}

                            {backups.map((b) => (
                                <tr key={b._id}>
                                    <td>
                                        <div className="backup-created-cell">
                                            <div>
                                                {b.createdAt
                                                    ? new Date(
                                                        b.createdAt
                                                    ).toLocaleString()
                                                    : "-"}
                                            </div>
                                            <div className="backup-id-text">
                                                {b.fileName || b._id}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{formatSize(b.sizeBytes)}</td>
                                    <td>
                                        {b.dbName || "main"}{" "}
                                        {b.collectionsCount
                                            ? `(${b.collectionsCount} collection(s))`
                                            : ""}
                                    </td>
                                    <td>
                                        <div className="backup-actions">
                                            <button
                                                className="backup-warning-btn"
                                                onClick={() =>
                                                    handleRestore(b._id)
                                                }
                                            >
                                                Restore
                                            </button>
                                            <button
                                                className="backup-outline-btn"
                                                onClick={() =>
                                                    handleDownload(b)
                                                }
                                            >
                                                Download
                                            </button>
                                            <button
                                                className="backup-danger-btn"
                                                onClick={() =>
                                                    handleDelete(b._id)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ℹ️ Backup Location Info */}
            <section className="backup-location-card">
                <h3>Backup Location</h3>
                <p>
                    Backups are stored on the server in a secure local folder.
                    You can also download backups to store them externally for
                    additional safety (USB, external drive, etc.).
                </p>
            </section>
        </div>
    );
}
