// src/Students/Browse.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import PublicNavbar from "./PublicNavbar.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Browse({ onNavigate }) {
  const navigate = useNavigate();

  const years = ["All Years", 2025, 2024, 2023];
  const departments = [
    "All Departments",
    "Information Technology",
    "Automotive",
    "Entertainment and Multimedia Computing",
  ];

  const [query, setQuery] = useState("");
  const [year, setYear] = useState("All Years");
  const [dept, setDept] = useState("All Departments");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.append("status", "approved");
        if (query.trim()) params.append("q", query.trim());
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
        if (err.name !== "AbortError")
          setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
    return () => controller.abort();
  }, [query, year, dept]);

  const openDetails = (id) => {
    onNavigate?.("details", id);
    navigate(`/details/${id}`);
  };

  return (
    <div className="dashboard">
      <PublicNavbar />

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

        <div className="browse-count">
          {loading
            ? "Loading projects..."
            : error
              ? `Error: ${error}`
              : `Showing ${projects.length} approved project${projects.length !== 1 ? "s" : ""
              }`}
        </div>

        <div className="browse-grid">
          {!loading && !error && projects.length === 0 && (
            <p style={{ textAlign: "center", color: "#888" }}>
              No approved projects found.
            </p>
          )}

          {projects.map((p) => (
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
                  onClick={() => openDetails(p._id)}
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
      </div>
    </div>
  );
}
