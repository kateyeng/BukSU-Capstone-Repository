import { useEffect, useMemo, useState } from "react";
import "../index.css";
import StudentNavbar from "./StudentNavbar.jsx";
import usePermissions from "../hooks/usePermissions";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Browse({ onLogout, onNavigate }) {
  const { can } = usePermissions();

  const go = (dest, id) => (e) => {
    e?.preventDefault();
    onNavigate?.(dest, id);
  };

  const years = ["All Years", 2025, 2024, 2023];

  const departments = [
    "All Departments",
    "Information Technology",
    "Automotive",
    "Entertainment and Multimedia Computing",
    "Food Tech",
  ];

  const [query, setQuery] = useState("");
  const [year, setYear] = useState("All Years");
  const [dept, setDept] = useState("All Departments");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 3;

  const [selectedYearFolder, setSelectedYearFolder] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [query, year, dept, selectedYearFolder]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.append("status", "approved");
        if (year !== "All Years") params.append("year", year);
        if (dept !== "All Departments") params.append("category", dept);

        const res = await fetch(
          `${API}/api/publicProjects?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        const items = (data.items || []).filter(
          (p) => (p.status || "pending") === "approved"
        );

        setProjects(items);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load projects");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [year, dept]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (normalizedQuery) {
        const haystack = Object.entries(p)
          .filter(
            ([key]) =>
              ![
                "_id",
                "owner",
                "fileUrl",
                "filePath",
                "cloudinaryPublicId",
                "fileSize",
                "mimeType",
                "views",
                "downloads",
                "__v",
                "createdAt",
                "updatedAt",
              ].includes(key)
          )
          .map(([_, value]) => {
            if (Array.isArray(value)) return value.join(" ");
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return "";
            return String(value);
          })
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedQuery)) return false;
      }

      if (year !== "All Years" && String(p.year) !== String(year)) return false;
      if (dept !== "All Departments" && p.category !== dept) return false;

      return true;
    });
  }, [projects, normalizedQuery, year, dept]);

  const yearGroups = filteredProjects.reduce((acc, p) => {
    const y = p.year || "Unknown";
    acc[y] = acc[y] || [];
    acc[y].push(p);
    return acc;
  }, {});

  const sortedYears = Object.keys(yearGroups).sort((a, b) => Number(b) - Number(a));

  const projectsInsideFolder =
    selectedYearFolder !== null ? yearGroups[selectedYearFolder] || [] : [];

  const total =
    selectedYearFolder === null ? sortedYears.length : projectsInsideFolder.length;

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;

  const visibleYears = sortedYears.slice(startIndex, startIndex + perPage);
  const visibleProjects = projectsInsideFolder.slice(startIndex, startIndex + perPage);

  return (
    <div className="dashboard">
      <StudentNavbar
        onLogout={onLogout}
        onNavigate={onNavigate}
        active="browse"
      />

      <div className="browse-page">
        <div className="browse-toolbar">
          <div className="searchbar">
            <svg viewBox="0 0 24 24" className="search-icon" aria-hidden>
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.71.71l.27.28v.79L20 20.5L21.5 19zM10 15.5A5.5 5.5 0 1 1 10 4.5a5.5 5.5 0 0 1 0 11z"
              />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or keyword..."
            />
          </div>

          <div className="filters-row">
            <div className="select-pill">
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <svg className="chev" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M7 10l5 5l5-5z" />
              </svg>
            </div>

            <div className="select-pill">
              <select value={dept} onChange={(e) => setDept(e.target.value)}>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <svg className="chev" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M7 10l5 5l5-5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="browse-count">
          {loading
            ? "Loading projects..."
            : error
            ? `Error: ${error}`
            : `Showing ${total} approved item${total !== 1 ? "s" : ""}`}
        </div>

        {!can.projectRead && (
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff7ed",
              color: "#9a3412",
              fontSize: 13,
            }}
          >
            Viewing project details is currently disabled by admin.
          </div>
        )}

        {selectedYearFolder !== null && (
          <div style={{ margin: "10px 0 18px" }}>
            <button
              className="btn-back-link"
              onClick={() => setSelectedYearFolder(null)}
            >
              ← Back to Year Folders
            </button>
          </div>
        )}

        <div className="browse-grid">
          {selectedYearFolder === null
            ? visibleYears.map((y) => (
                <article
                  key={y}
                  className="project-card browse-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedYearFolder(y)}
                >
                  <span className="badge blue">Year Folder</span>
                  <h3 className="project-title browse-title">{y}</h3>

                  <div className="meta browse-meta">
                    <div className="meta-item">
                      📁 <strong>{yearGroups[y].length}</strong> project
                      {yearGroups[y].length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="card-actions browse-actions">
                    <button className="btn-card btn-block">Open Folder</button>
                  </div>
                </article>
              ))
            : visibleProjects.map((p) => (
                <article key={p._id} className="project-card browse-card">
                  <span className="badge blue">{p.category}</span>

                  <h3 className="project-title browse-title">{p.title}</h3>

                  <div className="meta browse-meta">
                    <div className="meta-item browse-authors">
                      👤 <strong>Authors:</strong>{" "}
                      {Array.isArray(p.authors)
                        ? p.authors.join(", ")
                        : p.authors || "—"}
                    </div>

                    <div className="meta-item">
                      📅 <strong>Year:</strong> {p.year || "—"}
                    </div>
                  </div>

                  <div className="card-actions browse-actions">
                    {can.projectRead ? (
                      <button
                        className="btn-card btn-block"
                        onClick={go("details", p._id)}
                      >
                        View Details
                      </button>
                    ) : (
                      <button
                        className="btn-card btn-block"
                        type="button"
                        disabled
                        style={{ opacity: 0.6, cursor: "not-allowed" }}
                      >
                        View Disabled
                      </button>
                    )}
                  </div>
                </article>
              ))}
        </div>

        {!loading && !error && total > 0 && (
          <div
            className="pagination"
            style={{
              marginTop: "16px",
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-card"
            >
              ◀ Prev
            </button>

            <span style={{ fontSize: "14px", color: "#555" }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-card"
            >
              Next ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}