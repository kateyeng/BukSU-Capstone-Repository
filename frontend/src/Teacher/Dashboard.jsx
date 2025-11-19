// src/teacher/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

  const totals = useMemo(() => {
    const pending = thesis.filter(
      (t) => (t.status || "pending") === "pending"
    ).length;
    const approved = thesis.filter((t) => t.status === "approved").length;
    return { thesis: thesis.length, pending, approved };
  }, [thesis]);

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
          </div>
        </div>

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

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}
        >
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

function Sidebar() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

  return (
    <aside className="admin-sidebar">
      <div className="brand">
        <span className="dot" /> Teacher Panel
      </div>
      <nav className="nav">
        <NavLink
          to="/teacher"
          end
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/teacher/thesis"
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          Thesis
        </NavLink>
      </nav>
      <div className="sidebar-spacer" />
      <button
        className="logout"
        onClick={() => {
          fetch(`${API}/api/auth/logoutUser`, {
            method: "POST",
            credentials: "include",
          }).finally(() => (location.href = "/login"));
        }}
      >
        Logout
      </button>
    </aside>
  );
}
