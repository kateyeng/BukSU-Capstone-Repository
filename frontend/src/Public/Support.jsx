import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function SupportPage({ role }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "bug",
    title: "",
    description: "",
    page: window.location.pathname,
  });

  async function fetchTickets() {
    try {
      const res = await fetch(`${API}/api/support/tickets`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (e) {
      console.error("Fetch tickets error:", e);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: formData.category,
          title: formData.title.trim(),
          description: formData.description.trim(),
          page: formData.page,
          browserInfo: navigator.userAgent,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      toast.success("Support ticket created successfully");
      setFormData({ category: "bug", title: "", description: "", page: window.location.pathname });
      setShowForm(false);
      await fetchTickets();
    } catch (e) {
      console.error("Submit error:", e);
      toast.error("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1 style={{ marginBottom: 8 }}>Help & Support</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Found an issue or have a suggestion? Let us know!
      </p>

      {!showForm ? (
        <button
          className="btn"
          onClick={() => setShowForm(true)}
          style={{ background: "#3b82f6", color: "#fff", marginBottom: 20 }}
        >
          + Report Issue
        </button>
      ) : (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Report an Issue</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="input"
                style={{ width: "100%" }}
              >
                <option value="bug">Bug Report</option>
                <option value="feature_request">Feature Request</option>
                <option value="documentation">Documentation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Title
              </label>
              <input
                type="text"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="input"
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Description
              </label>
              <textarea
                placeholder="Please provide detailed information about the issue..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="input"
                rows="6"
                style={{ width: "100%", fontFamily: "monospace" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                className="btn"
                disabled={loading}
                style={{ background: "#059669", color: "#fff" }}
              >
                {loading ? "Submitting…" : "Submit Report"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowForm(false)}
                disabled={loading}
                style={{ background: "#d1d5db", color: "#1f2937" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 12, marginTop: 24 }}>Your Tickets</h2>

      {loading && !showForm ? (
        <div style={{ padding: 16, color: "#9ca3af" }}>Loading…</div>
      ) : tickets.length === 0 ? (
        <div
          style={{
            padding: 16,
            background: "#f3f4f6",
            borderRadius: 6,
            color: "#6b7280",
          }}
        >
          No support tickets yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: 16,
                background: ticket.status === "resolved" ? "#f0fdf4" : "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: 8,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {ticket.title}
                  </h3>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    <span
                      style={{
                        background: "#dbeafe",
                        color: "#1e40af",
                        padding: "2px 6px",
                        borderRadius: 3,
                        marginRight: 8,
                      }}
                    >
                      {ticket.category}
                    </span>
                    <span
                      style={{
                        background:
                          ticket.status === "open"
                            ? "#fef3c7"
                            : ticket.status === "in_progress"
                            ? "#bfdbfe"
                            : ticket.status === "resolved"
                            ? "#dcfce7"
                            : "#f3f4f6",
                        color:
                          ticket.status === "open"
                            ? "#92400e"
                            : ticket.status === "in_progress"
                            ? "#1e40af"
                            : ticket.status === "resolved"
                            ? "#166534"
                            : "#374151",
                        padding: "2px 6px",
                        borderRadius: 3,
                      }}
                    >
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>

              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#4b5563",
                  marginBottom: 8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {ticket.description.substring(0, 200)}
                {ticket.description.length > 200 ? "..." : ""}
              </p>

              {ticket.adminResponse && (
                <div
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: 4,
                    padding: 10,
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  <strong>Admin Response:</strong>
                  <p
                    style={{
                      marginTop: 4,
                      whiteSpace: "pre-wrap",
                      color: "#4b5563",
                    }}
                  >
                    {ticket.adminResponse}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
