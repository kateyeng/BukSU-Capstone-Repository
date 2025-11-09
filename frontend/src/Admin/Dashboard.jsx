import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./admin.css";


const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [thesis, setThesis] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true);
      try {
        const [uRes, tRes] = await Promise.all([
          fetch(`${API}/api/admin/users?limit=100`, { credentials: "include" }),
          fetch(`${API}/api/admin/thesis?limit=100`, { credentials: "include" }),
        ]);
        if (!uRes.ok || !tRes.ok) throw new Error("HTTP error");
        const [uJson, tJson] = await Promise.all([uRes.json(), tRes.json()]);
        if (!abort) {
          setUsers(uJson.users || uJson);
          setThesis(tJson.thesis || tJson);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => { abort = true; };
  }, []);

  const totals = useMemo(() => {
    const pending = thesis.filter(t => (t.status || "pending") === "pending").length;
    const approved = thesis.filter(t => t.status === "approved").length;
    return { users: users.length, thesis: thesis.length, pending, approved };
  }, [users, thesis]);

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">
        <div className="page-head">
          <div>
            <h1>Admin Dashboard</h1>
            <div className="sub">Overview of users and submissions</div>
          </div>
          <div className="actions">
            <button className="btn brand" onClick={() => navigate("/admin/thesis")}>Manage Thesis</button>
            <button className="btn primary" onClick={() => navigate("/admin/users")}>Manage Users</button>
          </div>
        </div>

        <section className="cards">
          <div className="card">
            <div className="label">Total Users</div>
            <div className="value">{totals.users}</div>
            <div className="hint">All registered accounts</div>
          </div>
          <div className="card">
            <div className="label">Thesis Submissions</div>
            <div className="value">{totals.thesis}</div>
            <div className="hint">{totals.approved} approved • {totals.pending} pending</div>
          </div>
          <div className="card">
            <div className="label">Pending Reviews</div>
            <div className="value">{totals.pending}</div>
            <div className="hint">Waiting for approval</div>
          </div>
        </section>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <div className="card">
            <div className="label">Recent Thesis</div>
            <table className="table" style={{marginTop:10}}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(thesis.slice(0,5)).map(t => (
                  <tr key={t._id}>
                    <td>{t.title || "—"}</td>
                    <td>{t.year || "—"}</td>
                    <td><span className={`badge ${t.status || "pending"}`}>{t.status || "pending"}</span></td>
                  </tr>
                ))}
                {!thesis.length && !loading && (
                  <tr><td colSpan="3">No data.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="label">Newest Users</div>
            <table className="table" style={{marginTop:10}}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {(users.slice(0,5)).map(u => (
                  <tr key={u._id}>
                    <td>{u.fullName || u.name || "—"}</td>
                    <td>{u.email}</td>
                    <td><span className="badge">{u.role}</span></td>
                  </tr>
                ))}
                {!users.length && !loading && (
                  <tr><td colSpan="3">No users.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Sidebar(){
  return (
    <aside className="admin-sidebar">
      <div className="brand"><span className="dot" /> Admin Panel</div>
      <nav className="nav">
        <NavLink to="/admin" end className={({isActive})=>isActive?"active":undefined}>Dashboard</NavLink>
        <NavLink to="/admin/thesis" className={({isActive})=>isActive?"active":undefined}>Thesis</NavLink>
        <NavLink to="/admin/users" className={({isActive})=>isActive?"active":undefined}>Users</NavLink>
      </nav>
      <div className="sidebar-spacer" />
      <button className="logout" onClick={()=>{
        fetch(`${API}/api/auth/logout`, {method:"POST", credentials:"include"}).finally(()=>location.href="/login");
      }}>Logout</button>
    </aside>
  );
}
