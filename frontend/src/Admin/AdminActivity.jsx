// src/Admin/AdminActivity.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const ACTION_LABELS = {
  login: "Login",
  logout: "Logout",
  login_failed: "Login Failed",
  view_details: "View Details",
  download_pdf: "Download PDF",
  backup_create: "Backup Created",
  backup_restore: "Backup Restored",
  backup_delete: "Backup Deleted",
  role_modified: "Role Modified",
  update_user: "User Updated",
  delete_user: "User Deleted",
  password_change: "Password Changed",
  security_event: "Security Event",
};

function formatLogDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMeta(meta) {
  if (!meta) return "No details recorded.";
  if (typeof meta !== "object") return String(meta);

  return Object.entries(meta)
    .map(([key, value]) => {
      const label = key.replace(/_/g, " ");
      const content =
        value && typeof value === "object" ? JSON.stringify(value) : String(value);
      return `${label}: ${content}`;
    })
    .join("\n");
}

export default function AdminActivity() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [users, setUsers] = useState([]);
  const [openUser, setOpenUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await api.get("/api/admin/activity/users", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
        withCredentials: true,
      });
      setUsers(res.data.users || []);
    } catch (error) {
      setErr(
        error.response?.data?.message ||
          error.message ||
          "Failed to load activity users"
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  async function openLogsFor(userRow) {
    setOpenUser(userRow);
    setLogsLoading(true);
    setUserLogs([]);

    try {
      const id = userRow?._id ? String(userRow._id) : "unknown";
      const res = await api.get(`/api/admin/activity/user/${id}?limit=300`, {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          action: actionFilter || undefined,
        },
        withCredentials: true,
      });
      setUserLogs(res.data.logs || []);
    } catch {
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
      link.setAttribute(
        "download",
        `activity_${openUser.fullName}_${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export PDF");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      const name = (user.fullName || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const role = (user.role || "").toLowerCase();
      const action = (user.lastAction || "").toLowerCase();

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

      <div className="admin-card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="admin-activity-toolbar">
          <input
            className="admin-input"
            placeholder="Search name, email, role, last action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="date"
            className="admin-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="admin-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <select
            className="admin-input"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="">All actions</option>
            <option value="login_failed">Security: Login Failed</option>
            <option value="password_change">Password Changes</option>
            <option value="backup_create">Backup Created</option>
            <option value="backup_restore">Backup Restored</option>
          </select>
          <button className="admin-btn admin-btn-primary" onClick={fetchUsers}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrapper">
          {loading ? (
            <div style={{ padding: 16 }}>Loading...</div>
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
                {filteredUsers.map((user) => (
                  <tr key={String(user._id) || "unknown"}>
                    <td>{user.fullName || "-"}</td>
                    <td>{user.email || "-"}</td>
                    <td>
                      <span
                        className={`admin-role-pill-tag role-${(user.role || "").toLowerCase()}`}
                      >
                        {(user.role || "-").toUpperCase()}
                      </span>
                    </td>
                    <td>{ACTION_LABELS[user.lastAction] || user.lastAction || "-"}</td>
                    <td>{user.lastAt ? formatLogDate(user.lastAt) : "-"}</td>
                    <td>{user.total || 0}</td>
                    <td className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => openLogsFor(user)}
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

      {openUser && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div
            className="admin-modal admin-modal-wide admin-activity-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="admin-modal-title">
              Activity - {openUser.fullName || "Unknown User"}
            </h3>

            <div className="admin-activity-subhead">
              <span>{openUser.email || "-"}</span>
              <span
                className={`admin-role-pill-tag role-${(openUser.role || "").toLowerCase()}`}
              >
                {(openUser.role || "-").toUpperCase()}
              </span>
            </div>

            <div className="admin-table-wrapper admin-table-wrapper-scroll">
              {logsLoading ? (
                <div style={{ padding: 16 }}>Loading logs...</div>
              ) : userLogs.length === 0 ? (
                <div style={{ padding: 16 }}>No logs for this user.</div>
              ) : (
                <table className="admin-table admin-log-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Action</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.map((log) => (
                      <tr key={log._id}>
                        <td className="admin-log-date">
                          {formatLogDate(log.createdAt)}
                        </td>
                        <td>
                          <span className="admin-log-action-pill">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td>
                          <pre className="admin-log-meta">{formatMeta(log.meta)}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {userLogs.length > 0 && (
              <div className="admin-activity-summary">
                <div className="admin-activity-summary-item">
                  <span className="admin-activity-summary-label">Latest IP</span>
                  <strong>{userLogs[0]?.ip || "-"}</strong>
                </div>
                <div className="admin-activity-summary-item">
                  <span className="admin-activity-summary-label">Device</span>
                  <strong>{userLogs[0]?.userAgent || "-"}</strong>
                </div>
              </div>
            )}

            <div className="admin-modal-actions admin-modal-actions-spread">
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
