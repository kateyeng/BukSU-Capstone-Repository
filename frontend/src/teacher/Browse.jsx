import { useState } from "react";
import "../index.css";

export default function Browse({ onBack, onNavigate }) {
  // Optional: same header so UI matches Dashboard
  // (You can remove this header if you already render one elsewhere)
  const Header = () => (
    <header className="dashboard-header">
      <div className="logo-area">
        <div className="logo-square" />
        <div>
          <div className="logo-title">BukSU CoT</div>
          <div className="logo-subtitle">Thesis Realm</div>
        </div>
      </div>

      <nav className="nav-links">
        <a href="#" onClick={(e)=>{e.preventDefault(); onNavigate?.("dashboard");}}>Home</a>
        <a href="#" className="active" onClick={(e)=>e.preventDefault()}>Browse</a>
        <a href="#">Upload</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </nav>

      <button className="logout-btn" onClick={onBack}>Back</button>
    </header>
  );

  // --- Demo dataset (swap with API later) ---
  const projects = [
    { id: 1, title: "Development of Smart Irrigation System Using IoT Technology", category: "Computer Engineering", authors: ["Juan Dela Cruz", "Maria Santos"], year: 2024, department: "Computer Engineering", excerpt: "This research presents an innovative approach to agricultural water management through the development of a smart irrigation system powered by microcontrollers and cloud analytics..." },
    { id: 2, title: "Machine Learning Application for Plant Disease Detection", category: "Information Technology", authors: ["Pedro Reyes", "Ana Garcia", "Jose Mercado"], year: 2024, department: "Information Technology", excerpt: "An intelligent system utilizing convolutional neural networks to identify and classify plant diseases from leaf images, enabling early intervention for farmers..." },
    { id: 3, title: "Renewable Energy Integration in Rural Communities", category: "Electrical Engineering", authors: ["Sofia Bautista", "Carlos Rivera"], year: 2023, department: "Electrical Engineering", excerpt: "This study explores sustainable solutions for providing electricity to off-grid rural communities through hybrid renewable energy systems..." },
    { id: 4, title: "Mobile Application for Student Information Management", category: "Information Technology", authors: ["Roberto Cruz", "Linda Fernandez"], year: 2023, department: "Information Technology", excerpt: "A comprehensive mobile solution designed to streamline student information management, attendance tracking, and grade monitoring." },
    { id: 5, title: "Automated Waste Segregation System Using Computer Vision", category: "Computer Engineering", authors: ["Michael Torres", "Angela Ramos"], year: 2024, department: "Computer Engineering", excerpt: "An intelligent waste management system that automatically sorts recyclable materials using advanced computer vision algorithms." },
    { id: 6, title: "Design and Development of Solar-Powered Water Pump", category: "Electrical Engineering", authors: ["David Gonzales"], year: 2023, department: "Electrical Engineering", excerpt: "An eco-friendly water pumping solution utilizing photovoltaic technology for agricultural irrigation in remote areas." },
  ];

  // --- Filters ---
  const years = ["All Years", 2024, 2023];
  const departments = ["All Departments","Computer Engineering","Information Technology","Electrical Engineering"];

  const [query, setQuery] = useState("");
  const [year, setYear] = useState("All Years");
  const [dept, setDept] = useState("All Departments");

  const filtered = projects.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      p.title.toLowerCase().includes(q) ||
      p.authors.join(" ").toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q);
    const matchesYear = year === "All Years" || String(p.year) === String(year);
    const matchesDept = dept === "All Departments" || p.department === dept;
    return matchesQuery && matchesYear && matchesDept;
  });

  return (
    <div className="dashboard">
      <Header />

      <div className="browse-page">
        {/* Toolbar */}
        <div className="browse-toolbar">
          {/* Search */}
          <div className="searchbar">
            <svg viewBox="0 0 24 24" className="search-icon" aria-hidden>
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.71.71l.27.28v.79L20 20.5L21.5 19zM10 15.5A5.5 5.5 0 1 1 10 4.5a5.5 5.5 0 0 1 0 11z"/>
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or keyword..."
            />
          </div>

          {/* Filters */}
          <div className="filters-row">
            <div className="select-pill">
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <svg className="chev" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M7 10l5 5l5-5z"/></svg>
            </div>

            <div className="select-pill">
              <select value={dept} onChange={(e) => setDept(e.target.value)}>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <svg className="chev" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M7 10l5 5l5-5z"/></svg>
            </div>

            <button className="btn-filter">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M3 5h18v2H3zm3 6h12v2H6zm3 6h6v2H9z" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        {/* Count */}
        <div className="browse-count">
          Showing <strong>{filtered.length}</strong> projects
        </div>

        {/* Grid */}
        <div className="browse-grid">
          {filtered.map((p) => (
            <article key={p.id} className="project-card">
              <span className="badge blue">{p.category}</span>
              <h3 className="project-title">{p.title}</h3>

              <div className="meta">
                <div className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5"/>
                  </svg>
                  <span>{p.authors.join(", ")}</span>
                </div>
                <div className="meta-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 9h14v10H5z"/>
                  </svg>
                  <span>{p.year}</span>
                </div>
              </div>

              <p className="project-excerpt">{p.excerpt}</p>

              <div className="card-actions">
                <button className="btn-card btn-block">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"/>
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