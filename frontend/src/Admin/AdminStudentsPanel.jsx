import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function AdminStudentsPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [thesis, setThesis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let abort = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [usersRes, thesisRes] = await Promise.all([
          api.get("/api/admin/users", { withCredentials: true }),
          api.get("/api/admin/thesis?limit=500", { withCredentials: true }),
        ]);

        if (abort) return;

        setUsers(usersRes.data?.users || []);
        setThesis(thesisRes.data?.thesis || []);
      } catch (err) {
        console.error("[ADMIN][STUDENTS][LOAD][ERROR]", err);
        if (!abort) {
          setError(err?.response?.data?.message || "Failed to load student panel.");
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }

    load();
    return () => {
      abort = true;
    };
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users
      .filter((user) => user.role === "student")
      .map((student) => {
        const docs = thesis.filter((item) => {
          const ownerId = item?.owner?._id || item?.owner || null;
          return String(ownerId || "") === String(student._id);
        });

        const pending = docs.filter((doc) => doc.status === "pending").length;
        const approved = docs.filter((doc) => doc.status === "approved").length;
        const rejected = docs.filter((doc) => doc.status === "rejected").length;

        return {
          ...student,
          documents: docs.length,
          pending,
          approved,
          rejected,
        };
      })
      .filter((student) => {
        if (!q) return true;
        const haystack = `${student.fullName} ${student.email}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [search, thesis, users]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 className="admin-heading" style={{ marginBottom: 4 }}>Student Panel</h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            View students and open their submissions with current review status.
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student name or email"
          className="admin-input"
          style={{ minWidth: 280 }}
        />
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: 16 }}>Loading student panel…</div>
        ) : error ? (
          <div style={{ padding: 16, color: "#b91c1c" }}>{error}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16 }}>No students found.</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Documents</th>
                  <th>Pending</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th className="admin-table-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((student) => (
                  <tr key={student._id}>
                    <td>{student.fullName || "—"}</td>
                    <td>{student.email || "—"}</td>
                    <td>{student.documents}</td>
                    <td>{student.pending}</td>
                    <td>{student.approved}</td>
                    <td>{student.rejected}</td>
                    <td className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() =>
                          navigate(`/admin/capstone?owner=${student._id}`)
                        }
                      >
                        Open Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
