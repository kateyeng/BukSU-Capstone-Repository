import { useState } from "react";
import "../index.css";

export default function TeacherContact({ onLogout, onNavigate }) {
  const [form, setForm] = useState({
    name: "Juan Dela Cruz",
    email: "",
    subject: "How can we help you?",
    message: "",
  });

  // helper for nav + logo
  const go = (dest) => (e) => {
    e.preventDefault();
    onNavigate?.(dest);
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert("Message sent (UI only).");
  }

  return (
    <div className="dashboard">
      {/* Navbar (teacher-scoped) */}
      <header className="dashboard-header">
        <div
          className="logo-area"
          onClick={go("dashboard")}
          style={{ textDecoration: "none", cursor: "pointer" }}
        >
          <div className="logo-square" />
          <div>
            <div className="logo-title">BukSU CoT</div>
            <div className="logo-subtitle">Capstone Repository</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" onClick={go("dashboard")}>Home</a>
          <a href="#" onClick={go("browse")}>Browse</a>
          <a href="#" onClick={go("upload")}>Upload</a>
          <a href="#" onClick={go("about")}>About</a>
          {/* Contact is active on this page */}
          <a
            href="#"
            className="active"
            onClick={(e) => e.preventDefault()}
          >
            Contact
          </a>
          <a href="#" onClick={go("profile")}>Profile</a>
        </nav>

        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </header>

      {/* Page content */}
      <main className="contact container">
        <h1 className="contact__title">Get In Touch</h1>
        <p className="contact__lead">
          Have questions, suggestions, or need assistance? We're here to help.
          Reach out to us using the contact information below or send us a message using the contact form.
        </p>

        <section className="contact__grid">
          {/* Left: info */}
          <div className="contact__info">
            <InfoBlock
              icon={
                <path
                  d="M12 2a10 10 0 1 0 10 10M9 11l2 2 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              }
              title="Address"
            >
              Bukidnon State University<br />
              College of Technology<br />
              Malaybalay City, Bukidnon<br />
              Philippines 8700
            </InfoBlock>

            <InfoBlock
              icon={
                <path
                  d="M4 6l8 6 8-6M4 18h16V6H4v12z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              }
              title="Email"
            >
              cot@buksu.edu.ph<br />
              thesis.realm@buksu.edu.ph
            </InfoBlock>

            <InfoBlock
              icon={
                <path
                  d="M2 5a3 3 0 0 1 3-3h1l2 4-2 2a14 14 0 0 0 8 8l2-2 4 2v1a3 3 0 0 1-3 3h-1C7.82 20.75 3.25 16.18 2 9V8a3 3 0 0 1 0-3z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              }
              title="Phone"
            >
              (088) 813-5661<br />
              Local 245
            </InfoBlock>

            <div className="hours-card">
              <h4>Office Hours</h4>
              <ul>
                <li>
                  <span>Monday - Friday:</span>
                  <strong>8:00 AM - 5:00 PM</strong>
                </li>
                <li>
                  <span>Saturday:</span>
                  <strong>9:00 AM - 12:00 PM</strong>
                </li>
                <li>
                  <span>Sunday:</span>
                  <strong>Closed</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: form */}
          <form className="contact__form" onSubmit={handleSubmit}>
            <h2>Send Us a Message</h2>

            <label>Your Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Juan Dela Cruz"
            />

            <label>Email Address</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your.email@buksu.edu.ph"
              type="email"
            />

            <label>Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="How can we help you?"
            />

            <label>Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Type your message here..."
              rows={6}
            />

            <button type="submit" className="contact__send">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12l16-8-4 16-4-6-8-2z" fill="currentColor" />
              </svg>
              <span>Send Message</span>
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function InfoBlock({ icon, title, children }) {
  return (
    <div className="info-block">
      <div className="info-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          {icon}
        </svg>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
