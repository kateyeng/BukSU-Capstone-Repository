// src/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";

/* guest removed here */
const ROLE_OPTIONS = ["student", "teacher", "admin"];

/* ===== Inline SVG icons (no emojis) ===== */
function EditIcon(props) {
    return (
        <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            aria-hidden="true"
            {...props}
        >
            <path
                d="M3 14.25V17h2.75L14.81 7.94l-2.75-2.75L3 14.25zM17.71 6.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0L11.46 3.8l2.75 2.75 3.5-3.5z"
                fill="currentColor"
            />
        </svg>
    );
}

function TrashIcon(props) {
    return (
        <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            aria-hidden="true"
            {...props}
        >
            <path d="M6 7h2v9H6V7zm6 0h2v9h-2V7z" fill="currentColor" />
            <path
                d="M4 5h12v2H4V5zm2-2h8v2H6V3zm2-2h4v2H8V1zM6 7h8v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"
                fill="currentColor"
            />
        </svg>
    );
}

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [busyId, setBusyId] = useState(null);

    // edit modal state
    const [editingUser, setEditingUser] = useState(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState("student");

    async function fetchUsers() {
        try {
            setLoading(true);
            const res = await api.get("/api/admin/users", { withCredentials: true });
            setUsers(res.data.users || []);
            setErr("");
        } catch (e) {
            setErr(e.response?.data?.message || e.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    function openEdit(user) {
        setEditingUser(user);
        setEditName(user.fullName || "");
        setEditEmail(user.email || "");
        // if user is guest, default select to "student"
        const baseRole = user.role === "guest" ? "student" : user.role;
        setEditRole(baseRole || "student");
    }

    function closeEdit() {
        setEditingUser(null);
        setEditName("");
        setEditEmail("");
        setEditRole("student");
    }

    async function saveEdit(e) {
        e.preventDefault();
        if (!editingUser) return;

        const trimmedName = editName.trim();
        const trimmedEmail = editEmail.trim();
        if (!trimmedName || !trimmedEmail) {
            alert("Name and email are required.");
            return;
        }

        const role = ROLE_OPTIONS.includes(editRole)
            ? editRole
            : editingUser.role;

        try {
            setBusyId(editingUser._id);

            // 1) update basic info
            await api.patch(
                `/api/admin/users/${editingUser._id}`,
                { fullName: trimmedName, email: trimmedEmail },
                { withCredentials: true }
            );

            // 2) update role if changed
            if (role !== editingUser.role) {
                await api.patch(
                    `/api/admin/users/${editingUser._id}/role`,
                    { role },
                    { withCredentials: true }
                );
            }

            await fetchUsers();
            closeEdit();
        } catch (e2) {
            alert(e2.response?.data?.message || "Failed to update user");
        } finally {
            setBusyId(null);
        }
    }

    async function deleteUser(userId) {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            setBusyId(userId);
            await api.delete(`/api/admin/users/${userId}`, {
                withCredentials: true,
            });
            await fetchUsers();
        } catch (e) {
            alert(e.response?.data?.message || "Failed to delete user");
        } finally {
            setBusyId(null);
        }
    }

    if (loading) return <p>Loading users…</p>;
    if (err) return <p className="admin-error">{err}</p>;

    return (
        <div>
            <h2 className="admin-heading">Users</h2>

            <div className="admin-card">
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th className="admin-table-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id}>
                                    <td>{u.fullName}</td>
                                    <td>{u.email}</td>
                                    <td className="admin-role-pill-cell">
                                        <span className={`admin-role-pill-tag role-${u.role}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        {u.createdAt &&
                                            new Date(u.createdAt).toLocaleDateString("en-PH")}
                                    </td>
                                    <td className="admin-table-actions">
                                        <button
                                            className="admin-icon-btn admin-icon-edit"
                                            title="Edit user"
                                            disabled={busyId === u._id}
                                            onClick={() => openEdit(u)}
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            className="admin-icon-btn admin-icon-delete"
                                            title="Delete user"
                                            disabled={busyId === u._id}
                                            onClick={() => deleteUser(u._id)}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!users.length && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: 16 }}>
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit modal */}
            {editingUser && (
                <div className="admin-modal-backdrop" onClick={closeEdit}>
                    <div
                        className="admin-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="admin-modal-title">Edit User</h3>
                        <form className="admin-modal-form" onSubmit={saveEdit}>
                            <label className="admin-modal-field">
                                <span>Name</span>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </label>

                            <label className="admin-modal-field">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                            </label>

                            <label className="admin-modal-field">
                                <span>Role</span>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                >
                                    {ROLE_OPTIONS.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    onClick={closeEdit}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="admin-btn admin-btn-primary"
                                    disabled={busyId === editingUser._id}
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
