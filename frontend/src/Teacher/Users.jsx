import { useEffect, useMemo, useState } from "react";
import "./admin.css";


const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function UsersPage(){
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState(null);

  async function load(){
    try{
      const res = await fetch(`${API}/api/admin/users?limit=500`, { credentials:"include" });
      const json = await res.json();
      setItems(json.users || json);
    }catch(e){ console.error(e); }
  }
  useEffect(()=>{ load(); }, []);

  const filtered = useMemo(()=>{
    return items.filter(u=>{
      const text = `${u.fullName||u.name} ${u.email} ${u.role}`.toLowerCase();
      return text.includes(q.toLowerCase());
    });
  }, [items, q]);

  async function saveRole(id, role){
    setSavingId(id);
    try{
      await fetch(`${API}/api/admin/users/${id}/role`,{
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        credentials:"include",
        body: JSON.stringify({ role }),
      });
      setItems(prev=>prev.map(u=>u._id===id?{...u, role}:u));
    }catch(e){ console.error(e); }
    finally{ setSavingId(null); }
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">
        <div className="page-head">
          <div>
            <h1>Users</h1>
            <div className="sub">View and manage roles</div>
          </div>
        </div>

        <div className="filters">
          <input className="input" placeholder="Search name or email…" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="btn" onClick={load}>Refresh</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{width:280}}>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th style={{width:220}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u=>(
              <tr key={u._id}>
                <td>{u.fullName || u.name || "—"}</td>
                <td>{u.email}</td>
                <td><span className="badge">{u.role}</span></td>
                <td className="actions">
                  <RoleSelect
                    value={u.role}
                    onChange={(r)=>saveRole(u._id, r)}
                    disabled={savingId===u._id}
                  />
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan="4">No users.</td></tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}

function RoleSelect({ value, onChange, disabled }){
  const [draft, setDraft] = useState(value);
  useEffect(()=>setDraft(value), [value]);
  return (
    <div style={{display:"flex", gap:8}}>
      <select className="select" value={draft} disabled={disabled} onChange={e=>setDraft(e.target.value)}>
        <option value="student">student</option>
        <option value="teacher">teacher</option>
        <option value="admin">admin</option>
      </select>
      <button className="btn primary" disabled={disabled || draft===value} onClick={()=>onChange(draft)}>
        {disabled ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function Sidebar(){
  return (
    <aside className="admin-sidebar">
      <div className="brand"><span className="dot" /> Admin Panel</div>
      <nav className="nav">
        <a href="/admin">Dashboard</a>
        <a href="/admin/thesis">Thesis</a>
        <a href="/admin/users" className="active">Users</a>
      </nav>
      <div className="sidebar-spacer" />
      <button className="logout" onClick={()=>{
        fetch(`${API}/api/auth/logout`, {method:"POST", credentials:"include"}).finally(()=>location.href="/login");
      }}>Logout</button>
    </aside>
  );
}
