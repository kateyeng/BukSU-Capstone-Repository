import { useEffect, useState } from "react";
import "./teacher.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TeacherAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`${API}/api/teacher/analytics`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Analytics error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) return <div className="card">Loading analytics…</div>;
  if (!stats) return <div className="card">Failed to load analytics</div>;

  const pendingPercent =
    stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0;
  const approvedPercent =
    stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  const rejectedPercent =
    stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Analytics</h2>

      {/* Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ background: "#f3f4f6" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            Total Submissions
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.total}</div>
        </div>

        <div className="card" style={{ background: "#fef3c7" }}>
          <div style={{ fontSize: 12, color: "#92400e", marginBottom: 4 }}>
            Pending
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.pending}</div>
        </div>

        <div className="card" style={{ background: "#dcfce7" }}>
          <div style={{ fontSize: 12, color: "#166534", marginBottom: 4 }}>
            Approved
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.approved}</div>
        </div>

        <div className="card" style={{ background: "#fee2e2" }}>
          <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 4 }}>
            Rejected
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.rejected}</div>
        </div>

        <div className="card" style={{ background: "#dbeafe" }}>
          <div style={{ fontSize: 12, color: "#1e40af", marginBottom: 4 }}>
            Graded
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.graded}</div>
        </div>

        <div className="card" style={{ background: "#f3e8ff" }}>
          <div style={{ fontSize: 12, color: "#6b21a8", marginBottom: 4 }}>
            Avg Grade
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#9333ea" }}>
            {stats.avgGrade > 0 ? stats.avgGrade.toFixed(1) : "—"}%
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
          Status Distribution
        </h3>
        <div style={{ display: "flex", gap: 4 }}>
          {stats.pending > 0 && (
            <div
              style={{
                flex: pendingPercent,
                background: "#fcd34d",
                height: 30,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "#78350f",
              }}
              title={`${stats.pending} Pending`}
            >
              {pendingPercent}%
            </div>
          )}
          {stats.approved > 0 && (
            <div
              style={{
                flex: approvedPercent,
                background: "#86efac",
                height: 30,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "#166534",
              }}
              title={`${stats.approved} Approved`}
            >
              {approvedPercent}%
            </div>
          )}
          {stats.rejected > 0 && (
            <div
              style={{
                flex: rejectedPercent,
                background: "#fca5a5",
                height: 30,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "#991b1b",
              }}
              title={`${stats.rejected} Rejected`}
            >
              {rejectedPercent}%
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recent && stats.recent.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
            Recent Activity
          </h3>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Grade</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((item) => (
                <tr key={item._id}>
                  <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                  </td>
                  <td>
                    <span className={`badge ${item.status}`}>{item.status}</span>
                  </td>
                  <td>
                    {item.grade?.score !== null && item.grade?.score !== undefined
                      ? `${item.grade.score}%`
                      : "—"}
                  </td>
                  <td style={{ fontSize: 12, color: "#9ca3af" }}>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
