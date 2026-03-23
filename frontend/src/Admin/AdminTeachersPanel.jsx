import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function AdminTeachersPanel() {
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
        console.error("[ADMIN][TEACHERS][LOAD][ERROR]", err);
        if (!abort) {
          setError(err?.response?.data?.message || "Failed to load teacher panel.");
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
      .filter((user) => user.role === "teacher")
      .map((teacher) => {
        const docs = thesis.filter((item) => {
          const adviserId =
            item?.adviser?._id || item?.adviser || item?.adviserId || null;
          return String(adviserId || "") === String(teacher._id);
        });

        const pending = docs.filter((doc) => doc.status === "pending").length;
        const approved = docs.filter((doc) => doc.status === "approved").length;
        const rejected = docs.filter((doc) => doc.status === "rejected").length;

        return {
          ...teacher,
          documents: docs.length,
          pending,
          approved,
          rejected,
        };
      })
      .filter((teacher) => {
        if (!q) return true;
        const haystack = `${teacher.fullName} ${teacher.email}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [search, thesis, users]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 className="admin-heading" style={{ marginBottom: 4 }}>Teacher Panel</h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            Browse faculty advisers and open the documents assigned to them.
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teacher name or email"
          className="admin-input"
          style={{ minWidth: 280 }}
        />
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: 16 }}>Loading teacher panel…</div>
        ) : error ? (
          <div style={{ padding: 16, color: "#b91c1c" }}>{error}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16 }}>No teachers found.</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Email</th>
                  <th>Documents</th>
                  <th>Pending</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                  <th className="admin-table-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((teacher) => (
                  <tr key={teacher._id}>
                    <td>{teacher.fullName || "—"}</td>
                    <td>{teacher.email || "—"}</td>
                    <td>{teacher.documents}</td>
                    <td>{teacher.pending}</td>
                    <td>{teacher.approved}</td>
                    <td>{teacher.rejected}</td>
                    <td className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() =>
                          navigate(`/admin/capstone?adviser=${teacher._id}`)
                        }
                      >
                        Open Documents
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
