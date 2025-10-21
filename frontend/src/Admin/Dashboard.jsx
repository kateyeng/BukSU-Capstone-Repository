// src/Admin/Dashboard.jsx
import "./../index.css";

export default function Dashboard({ onLogout }) {
  return (
    <div className="dashboard">
      {/* Navbar */}
      <header className="dashboard-header">
        <div className="logo-area">
          <div className="logo-square"></div>
          <div>
            <div className="logo-title">BukSU CoT</div>
            <div className="logo-subtitle">Thesis Realm</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" className="active">Home</a>
          <a href="#">Browse</a>
          <a href="#">Upload</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </nav>

        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-content">
          <h1>BukSU CoT Capstone Repository</h1>
          <p>
            Discover, explore, and share academic excellence. A centralized
            platform for thesis and capstone projects at Bukidnon State
            University College of Technology.
          </p>
          <div className="hero-buttons">
            <button className="browse-btn">Browse Projects</button>
            <button className="submit-btn">Submit Thesis</button>
          </div>
        </div>
      </main>
    </div>
  );
}
