import { useState } from "react";
import "./admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function EditThesisModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: item.title || "",
    category: item.category || "",
    year: item.year || "",
    abstract: item.abstract || "",
    authors: (item.authors || []).join(", "),
  });
  const [saving, setSaving] = useState(false);

  function update(k, v){ setForm(prev=>({ ...prev, [k]: v })); }

  async function save(){
    setSaving(true);
    try{
      const res = await fetch(`${API}/api/teacher/thesis/${item._id}`,{
        method:"PATCH",
        headers:{ "Content-Type":"application/json" },
        credentials:"include",
        body: JSON.stringify({
          ...form,
          authors: form.authors.split(",").map(s=>s.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      onSaved(json.thesis || json);
    }catch(e){ console.error(e); }
    finally{ setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <header>
          <strong>Edit Thesis</strong>
          <button className="btn" onClick={onClose}>Close</button>
        </header>
        <div className="content">
          <div className="row">
            <label className="label-sm">Title</label>
            <input className="field" value={form.title} onChange={e=>update("title", e.target.value)} />
          </div>
          <div className="row" style={{display:"grid", gridTemplateColumns:"1fr 200px", gap:12}}>
            <div>
              <label className="label-sm">Category</label>
              <input className="field" value={form.category} onChange={e=>update("category", e.target.value)} />
            </div>
            <div>
              <label className="label-sm">Year</label>
              <input className="field" type="number" value={form.year} onChange={e=>update("year", e.target.value)} />
            </div>
          </div>
          <div className="row">
            <label className="label-sm">Authors (comma-separated)</label>
            <input className="field" value={form.authors} onChange={e=>update("authors", e.target.value)} />
          </div>
          <div className="row">
            <label className="label-sm">Abstract</label>
            <textarea className="field" rows={6} value={form.abstract} onChange={e=>update("abstract", e.target.value)} />
          </div>
        </div>
        <footer>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={saving} onClick={save}>{saving?"Saving…":"Save changes"}</button>
        </footer>
      </div>
    </div>
  );
}
