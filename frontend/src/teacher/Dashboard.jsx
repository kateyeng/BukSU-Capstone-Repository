import "./../index.css";

export default function Dashboard({ onLogout, onNavigate = () => {} }) {
  const stats = [
    { label: "Total Projects", value: "1,247", sub: "+12% this month", icon: "book" },
    { label: "Latest Uploads", value: "48", sub: "This week", icon: "upload" },
    { label: "Most Viewed", value: "15.2K", sub: "Total views", icon: "eye" },
  ];

  const featured = [
    {
      id: 1,
      title: "Development of Smart Irrigation System Using IoT Technology",
      category: "Computer Engineering",
      authors: ["Juan Dela Cruz", "Maria Santos"],
      year: 2024,
      excerpt:
        "This research presents an innovative approach to agricultural water management through the development of a smart irrigation system powered by microcontrollers and cloud analytics...",
    },
    {
      id: 2,
      title: "Machine Learning Application for Plant Disease Detection",
      category: "Information Technology",
      authors: ["Pedro Reyes", "Ana Garcia", "Jose Mercado"],
      year: 2024,
      excerpt:
        "An intelligent system utilizing convolutional neural networks to identify and classify plant diseases from leaf images, enabling early intervention for farmers...",
    },
    {
      id: 3,
      title: "Renewable Energy Integration in Rural Communities",
      category: "Electrical Engineering",
      authors: ["Sofia Bautista", "Carlos Rivera"],
      year: 2023,
      excerpt:
        "Sustainable solutions for providing electricity to off-grid rural communities through hybrid renewable energy systems...",
    },
  ];

  const goBrowse = (e) => { if (e) e.preventDefault(); onNavigate("browse"); };
  const goUpload = (e) => { if (e) e.preventDefault(); onNavigate("upload"); };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <header className="dashboard-header">
        <div className="logo-area">
          <div className="logo-square" />
          <div>
            <div className="logo-title">BukSU CoT</div>
            <div className="logo-subtitle">Thesis Realm</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" className="active" onClick={(e)=>e.preventDefault()}>Home</a>
          <a href="#" onClick={goBrowse}>Browse</a>
          <a href="#" onClick={goUpload}>Upload</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </nav>

        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      {/* Hero */}
      <main className="hero">
        <div className="hero-content">
          <h1>BukSU CoT Thesis Realm</h1>
          <p>
            Discover, explore, and share academic excellence. A centralized platform
            for thesis and capstone projects at Bukidnon State University College of Technology.
          </p>
          <div className="hero-buttons">
            <button className="browse-btn" onClick={goBrowse}>Browse Projects</button>
            <button className="submit-btn" onClick={goUpload}>Submit Thesis</button>
          </div>
        </div>
      </main>

      {/* Stats */}
      <section className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-left">
              <div className="stat-header">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>

            <div className="stat-icon-box" aria-hidden>
              {s.icon === "book" && (
                <svg className="stat-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M6 4h11a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3V6a2 2 0 0 1 2-2m0 2v12a4 4 0 0 1 2-.54h9V6z"/>
                </svg>
              )}
              {s.icon === "upload" && (
                <svg className="stat-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 3l5 5h-3v6h-4V8H7l5-5M5 17h14v2H5z"/>
                </svg>
              )}
              {s.icon === "eye" && (
                <svg className="stat-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 6c5 0 9.27 3.11 11 7.5C21.27 17.89 17 21 12 21S2.73 17.89 1 13.5C2.73 9.11 7 6 12 6m0 3a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9"/>
                </svg>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Featured */}
      <section className="featured">
        <h2 className="featured-title text-center">Featured Projects</h2>
        <p className="featured-subtitle text-center">
          Explore the latest research and innovation from our talented students and faculty members.
        </p>

        <div className="project-grid">
          {featured.map((p) => (
            <article key={p.id} className="project-card">
              <span className="badge blue">{p.category}</span>
              <h3 className="project-title">{p.title}</h3>

              <div className="meta">
                <div className="meta-item" title="Authors">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-label="authors">
                    <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5" />
                  </svg>
                  <span>{p.authors.join(", ")}</span>
                </div>
                <div className="meta-item" title="Year">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-label="year">
                    <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M5 9h14v10H5z" />
                  </svg>
                  <span>{p.year}</span>
                </div>
              </div>

              <p className="project-excerpt">{p.excerpt}</p>

              <div className="card-actions">
                <button className="btn-card" onClick={goBrowse}>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"/>
                  </svg>
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="view-all-wrap">
          <button className="btn-outline" onClick={goBrowse}>
            View All Projects
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path fill="currentColor" d="M10 17l5-5l-5-5v10z"/>
            </svg>
          </button>
        </div>
      </section>

      <footer className="footer">
        <small>© {new Date().getFullYear()} BukSU CoT — Thesis Realm</small>
      </footer>
    </div>
  );
}