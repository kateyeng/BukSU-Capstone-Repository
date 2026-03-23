import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import "./teacher.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getOwnerId(thesis) {
  return thesis?.owner?._id || thesis?.owner || thesis?.submitterEmail || thesis?._id;
}

function getOwnerName(thesis) {
  return (
    thesis?.owner?.fullName ||
    thesis?.owner?.name ||
    thesis?.submitterName ||
    thesis?.submitterEmail ||
    "Unknown student"
  );
}

function getOwnerEmail(thesis) {
  return thesis?.owner?.email || thesis?.submitterEmail || "No email";
}

export default function TeacherAdviseesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeAdvisee, setActiveAdvisee] = useState(null);
  const [printRequested, setPrintRequested] = useState(false);

  useEffect(() => {
    let abort = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/teacher/thesis?limit=1000`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!abort) setItems(data?.thesis || data || []);
      } catch (err) {
        console.error("[TEACHER][ADVISEES][LOAD][ERROR]", err);
        if (!abort) setItems([]);
      } finally {
        if (!abort) setLoading(false);
      }
    }

    load();
    return () => {
      abort = true;
    };
  }, []);

  const advisees = useMemo(() => {
    const map = new Map();

    for (const thesis of items) {
      const ownerId = String(getOwnerId(thesis));
      if (!map.has(ownerId)) {
        map.set(ownerId, {
          _id: ownerId,
          name: getOwnerName(thesis),
          email: getOwnerEmail(thesis),
          submissions: [],
        });
      }

      map.get(ownerId).submissions.push(thesis);
    }

    return Array.from(map.values())
      .map((advisee) => {
        const submissions = [...advisee.submissions].sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        });

        const pending = submissions.filter(
          (item) => (item.status || "pending") === "pending"
        ).length;
        const approved = submissions.filter((item) => item.status === "approved").length;
        const rejected = submissions.filter((item) => item.status === "rejected").length;

        return {
          ...advisee,
          submissions,
          latest: submissions[0] || null,
          pending,
          approved,
          rejected,
        };
      })
      .filter((advisee) => {
        if (!query.trim()) return true;
        const haystack = `${advisee.name} ${advisee.email} ${advisee.submissions
          .map((item) => item.title || "")
          .join(" ")}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, query]);

  function openAdvisee(advisee) {
    setActiveAdvisee(advisee);
  }

  function printAdviseeReport(advisee) {
    setActiveAdvisee(advisee);
    setPrintRequested(true);
  }

  useEffect(() => {
    if (!printRequested || !activeAdvisee) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [activeAdvisee, printRequested]);

  useEffect(() => {
    function handleAfterPrint() {
      setPrintRequested(false);
    }

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <div className="page-head">
          <div>
            <h1>Advisees</h1>
            <div className="sub">
              Browse assigned students, review their submission status, and open a quick
              progress report.
            </div>
          </div>
        </div>

        <div className="filters">
          <input
            className="input"
            placeholder="Search student name, email, or thesis title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="hint">
            {loading ? "Loading..." : `${advisees.length} advisee${advisees.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Submissions</th>
                <th>Pending</th>
                <th>Latest Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {advisees.map((advisee) => (
                <tr key={advisee._id}>
                  <td>{advisee.name}</td>
                  <td>{advisee.email}</td>
                  <td>{advisee.submissions.length}</td>
                  <td>{advisee.pending}</td>
                  <td>
                    <span className={`badge ${advisee.latest?.status || "pending"}`}>
                      {advisee.latest?.status || "pending"}
                    </span>
                  </td>
                  <td>
                    <div className="actions actions-tight">
                      <button className="btn" onClick={() => openAdvisee(advisee)}>
                        View Profile
                      </button>
                      <button
                        className="btn"
                        onClick={() => navigate(`/teacher/thesis?owner=${advisee._id}`)}
                      >
                        View Documents
                      </button>
                      <button className="btn" onClick={() => printAdviseeReport(advisee)}>
                        Generate Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && advisees.length === 0 && (
                <tr>
                  <td colSpan="6">No advisees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {activeAdvisee && (
          <section className="advisee-print-area">
            <div className="advisee-print-header">
              <div>
                <div className="advisee-print-kicker">BukSU CoT Thesis Portal</div>
                <h1>Advisee Progress Report</h1>
                <p>
                  Student: <strong>{activeAdvisee.name}</strong>
                </p>
                <p>
                  Email: <strong>{activeAdvisee.email}</strong>
                </p>
              </div>
              <div className="advisee-print-meta">
                <div>Generated</div>
                <strong>{new Date().toLocaleString()}</strong>
              </div>
            </div>

            <div className="advisee-print-metrics">
              <div className="advisee-print-metric">
                <span>Total Submissions</span>
                <strong>{activeAdvisee.submissions.length}</strong>
              </div>
              <div className="advisee-print-metric">
                <span>Pending</span>
                <strong>{activeAdvisee.pending}</strong>
              </div>
              <div className="advisee-print-metric">
                <span>Approved</span>
                <strong>{activeAdvisee.approved}</strong>
              </div>
              <div className="advisee-print-metric">
                <span>Rejected</span>
                <strong>{activeAdvisee.rejected}</strong>
              </div>
            </div>

            <div className="advisee-print-section">
              <h2>Submission History</h2>
              <table className="advisee-print-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAdvisee.submissions.map((item) => (
                    <tr key={item._id}>
                      <td>{item.title || "-"}</td>
                      <td>{item.year || "-"}</td>
                      <td>{item.status || "pending"}</td>
                      <td>
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeAdvisee && (
          <div
            className="modal-backdrop"
            onClick={() => setActiveAdvisee(null)}
            style={{ zIndex: 1200 }}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 900, width: "100%" }}
            >
              <header>
                <strong>{activeAdvisee.name}</strong>
                <button className="btn" onClick={() => setActiveAdvisee(null)}>
                  Close
                </button>
              </header>

              <div className="content" style={{ display: "grid", gap: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div className="card" style={{ margin: 0 }}>
                    <div className="label">Email</div>
                    <div style={{ marginTop: 8 }}>{activeAdvisee.email}</div>
                  </div>
                  <div className="card" style={{ margin: 0 }}>
                    <div className="label">Total Submissions</div>
                    <div className="value">{activeAdvisee.submissions.length}</div>
                  </div>
                  <div className="card" style={{ margin: 0 }}>
                    <div className="label">Pending</div>
                    <div className="value">{activeAdvisee.pending}</div>
                  </div>
                  <div className="card" style={{ margin: 0 }}>
                    <div className="label">Approved</div>
                    <div className="value">{activeAdvisee.approved}</div>
                  </div>
                </div>

                <div>
                  <div className="label" style={{ marginBottom: 10 }}>
                    Submission History
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Year</th>
                        <th>Status</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAdvisee.submissions.map((item) => (
                        <tr key={item._id}>
                          <td>{item.title || "-"}</td>
                          <td>{item.year || "-"}</td>
                          <td>
                            <span className={`badge ${item.status || "pending"}`}>
                              {item.status || "pending"}
                            </span>
                          </td>
                          <td>
                            {item.updatedAt
                              ? new Date(item.updatedAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <footer>
                <button className="btn" onClick={() => printAdviseeReport(activeAdvisee)}>
                  Print Progress Report
                </button>
                <button
                  className="btn primary"
                  onClick={() => navigate(`/teacher/thesis?owner=${activeAdvisee._id}`)}
                >
                  Open Student Documents
                </button>
              </footer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
