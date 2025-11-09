import { useEffect, useMemo, useState } from "react";
import EditThesisModal from "./EditThesisModal.jsx";
import "./admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ThesisPage(){
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(""); // per-row busy

  async function load(){
    setLoading(true);
    try{
      const res = await fetch(`${API}/api/admin/thesis?limit=500`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setItems(json.thesis || json);
      console.log("[ADMIN][LOAD] Loaded thesis list:", (json.thesis || json)?.length ?? 0);
    }catch(e){ 
      console.error("[ADMIN][LOAD][ERROR]", e);
      alert("Failed to load thesis list.");
    }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  async function updateStatus(id, next, extra = {}){
    const prev = items.find(i => i._id === id);
    console.log(`[ADMIN][STATUS][REQUEST] ${next.toUpperCase()} — id=${id}, title="${prev?.title}"`, extra);

    setBusyId(id);
    // optimistic
    setItems(list => list.map(i => i._id===id ? { ...i, status: next } : i));
    try{
      const res = await fetch(`${API}/api/admin/thesis/${id}/status`, {
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        credentials:"include",
        body: JSON.stringify({ status: next, ...extra }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // sync row if server returns it
      if (data?.thesis?._id) {
        setItems(list => list.map(i => i._id===id ? data.thesis : i));
      }

      // Try to read email status if your backend returns it
      const mailInfo = data?.emailStatus;
        console.log(
          `[ADMIN][STATUS][SUCCESS] ${next.toUpperCase()} — id=${id}, title="${prev?.title}"`,
          { thesis: data?.thesis?._id ? "updated" : "no-row", emailStatus: mailInfo ?? "no-mail-info" }
        );

      toast(`${next === "approved" ? "Approved" : "Rejected"} — email notification queued.`);
    }catch(e){
      console.error(`[ADMIN][STATUS][ERROR] Failed to set status "${next}" — id=${id}, title="${prev?.title}"`, e);
      alert(`Failed to set status to "${next}". Reverting.`);
      // rollback
      setItems(list => list.map(i => i._id===id ? prev : i));
    }finally{
      setBusyId("");
    }
  }

  function onApprove(t){
    if (!confirm(`Approve "${t.title}"?`)) return;
    updateStatus(t._id, "approved");
  }

  function onReject(t){
    if (!confirm(`Reject "${t.title}"?`)) return;
    const reason = prompt("Optional: add a rejection reason (shown in the email):") || undefined;
    updateStatus(t._id, "rejected", reason ? { reason } : {});
  }

  const filtered = useMemo(()=>{
    return items.filter(i=>{
      const okStatus = status==="all" ? true : (i.status||"pending")===status;
      const text = `${i.title} ${i.category} ${i.year} ${(i.authors||[]).join(" ")}`.toLowerCase();
      return okStatus && text.includes(q.toLowerCase());
    });
  }, [items, q, status]);

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">
        <div className="page-head">
          <div>
            <h1>Thesis</h1>
            <div className="sub">Approve, reject, or edit submissions</div>
          </div>
        </div>

        <div className="filters">
          <input
            className="input"
            placeholder="Search title, author, year…"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
          <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{width:360}}>Title</th>
              <th>Year</th>
              <th>Category</th>
              <th>Authors</th>
              <th>Status</th>
              <th style={{width:320}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t=>(
              <tr key={t._id} className={busyId===t._id ? "row-busy" : ""}>
                <td>{t.title}</td>
                <td>{t.year || "—"}</td>
                <td>{t.category || "—"}</td>
                <td>{(t.authors || []).join(", ") || "—"}</td>
                <td>
                  <span className={`badge ${t.status || "pending"}`}>{t.status || "pending"}</span>
                </td>
                <td className="actions">
                  <button
                    className="btn success"
                    onClick={()=>onApprove(t)}
                    disabled={busyId===t._id}
                    title="Approve and notify"
                  >
                    {busyId===t._id ? "Working…" : "Approve"}
                  </button>
                  <button
                    className="btn warn"
                    onClick={()=>onReject(t)}
                    disabled={busyId===t._id}
                    title="Reject and notify"
                  >
                    Reject
                  </button>
                  <button
                    className="btn brand"
                    onClick={()=>{
                      console.log(`[ADMIN][EDIT][OPEN] id=${t._id}, title="${t.title}"`);
                      setEditItem(t);
                    }}
                    disabled={busyId===t._id}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan="6">No results.</td></tr>
            )}
          </tbody>
        </table>

        {editItem && (
          <EditThesisModal
            item={editItem}
            onClose={()=>{
              console.log("[ADMIN][EDIT][CLOSE] modal closed");
              setEditItem(null);
            }}
            onSaved={(updated)=>{
              setItems(prev=>prev.map(p=>p._id===updated._id ? updated : p));
              setEditItem(null);
              toast("Changes saved — email notification queued.");
              console.log("[ADMIN][EDIT][SUCCESS] saved and email queued", {
                id: updated._id,
                title: updated.title,
              });
            }}
          />
        )}
      </main>
    </div>
  );
}

function Sidebar(){
  return (
    <aside className="admin-sidebar">
      <div className="brand"><span className="dot" /> Admin Panel</div>
      <nav className="nav">
        <a href="/admin">Dashboard</a>
        <a href="/admin/thesis" className="active">Thesis</a>
        <a href="/admin/users">Users</a>
      </nav>
      <div className="sidebar-spacer" />
      <button
        className="logout"
        onClick={()=>{
          console.log("[ADMIN][LOGOUT][REQUEST]");
          fetch(`${API}/api/auth/logout`, {method:"POST", credentials:"include"})
            .finally(()=>{
              console.log("[ADMIN][LOGOUT][DONE] redirecting to /login");
              location.href="/login";
            });
        }}
      >
        Logout
      </button>
    </aside>
  );
}

// super-light toast without deps
function toast(msg){
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #111; color: #fff; padding: 10px 14px; border-radius: 8px;
    font-size: 14px; box-shadow: 0 6px 20px rgba(0,0,0,.2); z-index: 9999;
  `;
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 1800);
  setTimeout(()=> el.remove(), 2200);
}
