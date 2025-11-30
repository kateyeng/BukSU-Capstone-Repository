import { useEffect, useState } from "react";
import "../index.css";
import StudentNavbar from "./StudentNavbar.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Browse({ onLogout, onNavigate }) {
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

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 9;

  // reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [query, year, dept]);

  // fetch APPROVED projects from backend
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.append("status", "approved"); // only approved
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

        // extra safety: keep only approved
        const items = (data.items || []).filter(
          (p) => (p.status || "pending") === "approved"
        );

        // DEBUG: see what fields we actually have
        console.log("[Browse] loaded projects:", items);
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

  // ---------- SUPER ROBUST FRONTEND SEARCH ----------
  const normalizedQuery = query.trim().toLowerCase();

  const filteredProjects = projects.filter((p) => {
    if (normalizedQuery) {
      // Build one big text string from almost all fields
      const haystack = Object.entries(p)
        .filter(([key]) =>
          // ignore purely technical / non-text fields
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

    // extra safety: respect filters
    if (year !== "All Years" && String(p.year) !== String(year)) return false;
    if (dept !== "All Departments" && p.category !== dept) return false;

    return true;
  });

  // ---------- PAGINATION ----------
  const total = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedProjects = filteredProjects.slice(
    startIndex,
    startIndex + perPage
  );

  return (
    <div className="dashboard">
      <StudentNavbar
        onLogout={onLogout}
        onNavigate={onNavigate}
        active="browse"
      />

      {/* toolbar: search + filters */}
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
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
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
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
              >
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

        {/* count text */}
        <div className="browse-count">
          {loading
            ? "Loading projects..."
            : error
              ? `Error: ${error}`
              : `Showing ${total} approved project${total !== 1 ? "s" : ""}`}
        </div>

        {/* cards */}
        <div className="browse-grid">
          {!loading && !error && paginatedProjects.length === 0 && (
            <p style={{ textAlign: "center", color: "#888" }}>
              No approved projects found.
            </p>
          )}

          {paginatedProjects.map((p) => (
            <article key={p._id} className="project-card">
              <span className="badge blue">{p.category}</span>
              <h3 className="project-title">{p.title}</h3>

              <div className="meta">
                <div className="meta-item">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      fill="currentColor"
                      d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5"
                    />
                  </svg>
                  <span>
                    {Array.isArray(p.authors)
                      ? p.authors.join(", ")
                      : p.authors}
                  </span>
                </div>
                <div className="meta-item">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      fill="currentColor"
                      d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 9h14v10H5z"
                    />
                  </svg>
                  <span>{p.year}</span>
                </div>
              </div>

              <p className="project-excerpt">
                {p.abstract?.slice(0, 180)}
                {p.abstract?.length > 180 ? "..." : ""}
              </p>

              <div className="card-actions">
                <button
                  className="btn-card btn-block"
                  onClick={go("details", p._id)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      fill="currentColor"
                      d="M3 6h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"
                    />
                  </svg>
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* pagination controls */}
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
