// src/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

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

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("student");

  /* ---- load users ---- */
  async function fetchUsers() {
    try {
      const res = await api.get("/api/admin/users", {
        withCredentials: true,
      });
      setUsers(res.data.users || []);
      setErr("");
    } catch (e) {
      setErr(
        e.response?.data?.message || e.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, []);

  // 🔁 poll every 5s so other admins see locks disappear/appear
  useEffect(() => {
    const id = setInterval(fetchUsers, 5000);
    return () => clearInterval(id);
  }, []);

  /* ---- acquire lock + open modal ---- */
  async function openEdit(user) {
    try {
      setBusyId(user._id);

      // Ask server for the lock
      await api.post(
        `/api/admin/users/${user._id}/lock`,
        {},
        { withCredentials: true }
      );

      // Lock acquired → open modal
      setEditingUser(user);
      setEditName(user.fullName || "");
      setEditEmail(user.email || "");
      const baseRole = user.role === "guest" ? "student" : user.role;
      setEditRole(baseRole || "student");
    } catch (e) {
      alert(
        e.response?.status === 423
          ? "Another admin is currently editing this user."
          : e.response?.data?.message || "Failed to acquire edit lock."
      );
      // Refresh list so we show the locked state
      fetchUsers();
    } finally {
      setBusyId(null);
    }
  }

  /* ---- release lock + close modal ---- */
  async function closeEdit() {
    if (editingUser) {
      try {
        await api.post(
          `/api/admin/users/${editingUser._id}/unlock`,
          {},
          { withCredentials: true }
        );
        await fetchUsers();
      } catch {
        // ignore error; lock will expire eventually
      }
    }

    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("student");
  }

  /* ---- save changes ---- */
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

    const roleChanged = role !== editingUser.role;

    try {
      setBusyId(editingUser._id);

      // basic details
      await api.patch(
        `/api/admin/users/${editingUser._id}`,
        { fullName: trimmedName, email: trimmedEmail },
        { withCredentials: true }
      );

      // role update (optional)
      if (roleChanged) {
        await api.patch(
          `/api/admin/users/${editingUser._id}/role`,
          { role },
          { withCredentials: true }
        );
      }

      await fetchUsers();

      // ✅ toast feedback
      if (roleChanged) {
        toast.success("User role updated successfully");
      } else {
        toast.success("User updated successfully");
      }
    } catch (e2) {
      alert(e2.response?.data?.message || "Failed to update user");
      return; // don't close modal if save failed
    } finally {
      setBusyId(null);
    }

    // Release lock after successful save
    await closeEdit();
  }

  async function deleteUser(userId) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      setBusyId(userId);
      await api.delete(`/api/admin/users/${userId}`, {
        withCredentials: true,
      });
      await fetchUsers();
      toast.success("User deleted successfully");
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
              {users.map((u) => {
                const lock = u.editLock;
                const isLockedByOther =
                  lock &&
                  lock.lockedBy &&
                  currentUser &&
                  lock.lockedBy !== currentUser._id;

                return (
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
                      {/* 🔒 If another admin holds the lock, show centered "Editing…" instead of buttons */}
                      {isLockedByOther ? (
                        <span className="admin-lock-tag">Editing…</span>
                      ) : (
                        <>
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
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!users.length && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: 16 }}
                  >
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
