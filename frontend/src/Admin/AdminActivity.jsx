// src/Admin/AdminActivity.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const ACTION_LABELS = {
  login: "Login",
  logout: "Logout",
  login_failed: "Login Failed",
  view_details: "View Details",
  download_pdf: "Download PDF",
};

export default function AdminActivity() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // summary list (one row per user)
  const [users, setUsers] = useState([]);

  // modal detail logs
  const [openUser, setOpenUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // search/filter for summary list
  const [search, setSearch] = useState("");

  async function fetchUsers() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/admin/activity/users", {
        withCredentials: true,
      });
      setUsers(res.data.users || []);
    } catch (e) {
      setErr(e.response?.data?.message || e.message || "Failed to load activity users");
    } finally {
      setLoading(false);
    }
  }

  async function openLogsFor(userRow) {
    setOpenUser(userRow);
    setLogsLoading(true);
    setUserLogs([]);

    try {
      const id = userRow?._id ? String(userRow._id) : "unknown";
      const res = await api.get(`/api/admin/activity/user/${id}?limit=300`, {
        withCredentials: true,
      });
      setUserLogs(res.data.logs || []);
    } catch (e) {
      setUserLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  function closeModal() {
    setOpenUser(null);
    setUserLogs([]);
  }

  async function handleExportPDF() {
    if (!openUser || !userLogs.length) {
      alert("No logs to export");
      return;
    }

    try {
      const userId = openUser?._id ? String(openUser._id) : "unknown";
      const response = await api.get(
        `/api/admin/activity/user/${userId}/export-pdf?limit=500`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `activity_${openUser.fullName}_${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
      alert("Failed to export PDF");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.fullName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      const action = (u.lastAction || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        action.includes(q)
      );
    });
  }, [users, search]);

  return (
    <div>
      <h2 className="admin-heading">Activity Logs</h2>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            className="admin-input"
            placeholder="Search name, email, role, last action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="admin-btn admin-btn-primary" onClick={fetchUsers}>
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="admin-card">
        <div className="admin-table-wrapper">
          {loading ? (
            <div style={{ padding: 16 }}>Loading…</div>
          ) : err ? (
            <div style={{ padding: 16, color: "#b91c1c" }}>{err}</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: 16 }}>No users found.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Action</th>
                  <th>Last Seen</th>
                  <th>Total Logs</th>
                  <th className="admin-table-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={String(u._id) || "unknown"}>
                    <td>{u.fullName || "—"}</td>
                    <td>{u.email || "—"}</td>
                    <td>
                      <span className={`admin-role-pill-tag role-${(u.role || "").toLowerCase()}`}>
                        {(u.role || "—").toUpperCase()}
                      </span>
                    </td>
                    <td>{ACTION_LABELS[u.lastAction] || u.lastAction || "—"}</td>
                    <td>{u.lastAt ? new Date(u.lastAt).toLocaleString("en-PH") : "—"}</td>
                    <td>{u.total || 0}</td>
                    <td className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => openLogsFor(u)}
                      >
                        View Activity
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {openUser && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">
              Activity — {openUser.fullName || "Unknown User"}
            </h3>

            <div style={{ marginBottom: 12, color: "#555" }}>
              {openUser.email || "—"} • {(openUser.role || "—").toUpperCase()}
            </div>

            <div className="admin-table-wrapper" style={{ maxHeight: 420, overflow: "auto" }}>
              {logsLoading ? (
                <div style={{ padding: 16 }}>Loading logs…</div>
              ) : userLogs.length === 0 ? (
                <div style={{ padding: 16 }}>No logs for this user.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Action</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.map((l) => (
                      <tr key={l._id}>
                        <td>{new Date(l.createdAt).toLocaleString("en-PH")}</td>
                        <td>{ACTION_LABELS[l.action] || l.action}</td>
                        <td style={{ color: "#555" }}>
                          {l.meta ? JSON.stringify(l.meta) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-primary" onClick={handleExportPDF}>
                Export as PDF
              </button>
              <button className="admin-btn admin-btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
