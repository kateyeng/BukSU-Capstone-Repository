// src/teacher/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./teacher.css";
import Sidebar from "./Sidebar.jsx";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";  

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const STATUS_COLORS = {
  Approved: "#22c55e", // green
  Pending: "#eab308",  // yellow
  Rejected: "#ef4444", // red
};

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let abort = false;

    async function load() {
      setLoading(true);
      try {
        const tRes = await fetch(`${API}/api/teacher/thesis?limit=100`, {
          credentials: "include",
        });
        if (!tRes.ok) throw new Error(`HTTP ${tRes.status}`);
        const tJson = await tRes.json();
        if (!abort) {
          setThesis(tJson.thesis || tJson);
        }
      } catch (e) {
        console.error("[TeacherDashboard] load error:", e);
      } finally {
        if (!abort) setLoading(false);
      }
    }

    load();
    return () => {
      abort = true;
    };
  }, []);

  /* ====== totals ====== */
  const totals = useMemo(() => {
    const pending = thesis.filter(
      (t) => (t.status || "pending") === "pending"
    ).length;
    const approved = thesis.filter((t) => t.status === "approved").length;
    const rejected = thesis.filter((t) => t.status === "rejected").length;
    return { thesis: thesis.length, pending, approved, rejected };
  }, [thesis]);

  /* ====== chart data ====== */
  const statusData = useMemo(
    () => [
      { name: "Approved", value: totals.approved },
      { name: "Pending", value: totals.pending },
      { name: "Rejected", value: totals.rejected },
    ],
    [totals]
  );

  // simple “per year” pie like “Users by Role”
  const yearData = useMemo(() => {
    const map = {};
    thesis.forEach((t) => {
      const year = t.year || "Unknown";
      map[year] = (map[year] || 0) + 1;
    });
    return Object.entries(map).map(([year, value]) => ({
      name: year,
      value,
    }));
  }, [thesis]);

  const YEAR_COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f97316", "#06b6d4"];

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">
        <div className="page-head">
          <div>
            <h1>Teacher Dashboard</h1>
            <div className="sub">Overview of thesis submissions</div>
          </div>
          <div className="actions">
            <button
              className="btn brand"
              onClick={() => navigate("/teacher/thesis")}
            >
              Manage Thesis
            </button>
            <button
              className="btn"
              onClick={() => navigate("/teacher/activity")}
            >
              Activity Log
            </button>
          </div>
        </div>

        {/* top cards */}
        <section className="cards">
          <div className="card">
            <div className="label">Thesis Submissions</div>
            <div className="value">{totals.thesis}</div>
            <div className="hint">
              {totals.approved} approved • {totals.pending} pending
            </div>
          </div>
          <div className="card">
            <div className="label">Pending Reviews</div>
            <div className="value">{totals.pending}</div>
            <div className="hint">Waiting for approval</div>
          </div>
        </section>

        {/* ===== CHARTS LIKE ADMIN (2 PIE CHARTS) ===== */}
        <section className="charts-row">
          {/* Thesis by Status */}
          <div className="card chart-card">
            <div className="label">Thesis by Status</div>
            <div className="chart-inner">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Thesis by Year */}
          <div className="card chart-card">
            <div className="label">Thesis by Year</div>
            <div className="chart-inner">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={yearData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {yearData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={YEAR_COLORS[index % YEAR_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* recent table */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="card">
            <div className="label">Recent Thesis</div>
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {thesis.slice(0, 5).map((t) => (
                  <tr key={t._id}>
                    <td>{t.title || "—"}</td>
                    <td>{t.year || "—"}</td>
                    <td>
                      <span className={`badge ${t.status || "pending"}`}>
                        {t.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!thesis.length && !loading && (
                  <tr>
                    <td colSpan="3">No thesis submissions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
