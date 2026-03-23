import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function StudentEditThesisModal({ item, onClose, onSaved }) {
  const [title, setTitle] = useState(item?.title || "");
  const [category, setCategory] = useState(item?.category || "");
  const [year, setYear] = useState(item?.year || "");
  const [authors, setAuthors] = useState((item?.authors || []).join(", "));
  const [adviser, setAdviser] = useState(
    typeof item?.adviser === "object" ? item?.adviser?._id || "" : item?.adviser || ""
  );
  const [department, setDepartment] = useState(item?.department || "");
  const [abstract, setAbstract] = useState(item?.abstract || "");
  const [keywords, setKeywords] = useState((item?.tags || []).join(", "));
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [teachersError, setTeachersError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchTeachers() {
      try {
        setTeachersLoading(true);
        setTeachersError("");

        const res = await api.get("/api/users/teachers", {
          withCredentials: true,
        });

        const list = res.data?.teachers || res.data || [];
        if (!cancelled) setTeachers(list);
      } catch (err) {
        console.error("[EDIT][LOAD_TEACHERS][ERROR]", err?.response?.data || err);
        if (!cancelled) {
          setTeachersError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load advisers"
          );
        }
      } finally {
        if (!cancelled) setTeachersLoading(false);
      }
    }

    fetchTeachers();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!item?._id) return;

    setSaving(true);

    try {
      if (file) {
        const isPdf =
          file.type === "application/pdf" && /\.pdf$/i.test(file.name || "");
        if (!isPdf) {
          throw new Error("Only PDF files are allowed");
        }
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("year", String(year));
      formData.append("abstract", abstract);
      formData.append("authors", authors);
      formData.append("adviser", adviser || "");
      formData.append("department", department || "");
      formData.append("keywords", keywords || "");
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch(`${API}/api/student/projects/${item._id}`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `HTTP ${res.status}`);
      }

      const updated = await res.json();
      toast.success("Changes saved.");
      onSaved?.(updated);
    } catch (err) {
      console.error("[STUDENT][EDIT_THESIS][ERROR]", err);
      toast.error(err.message || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="modal"
        style={{
          maxWidth: 860,
          width: "100%",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <strong>Edit Thesis</strong>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 13,
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </header>

        <form onSubmit={handleSave}>
          <div style={{ padding: "16px 20px", maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                  color: "#6b7280",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.04,
                    color: "#6b7280",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Category
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.04,
                    color: "#6b7280",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Year
                </label>
                <input
                  type="number"
                  min="1900"
                  max="3000"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                  color: "#6b7280",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Authors (comma-separated)
              </label>
              <input
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.2fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.04,
                    color: "#6b7280",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Adviser
                </label>

                <select
                  value={adviser}
                  onChange={(e) => setAdviser(e.target.value)}
                  disabled={teachersLoading || saving}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="">
                    {teachersLoading
                      ? "Loading advisers..."
                      : teachersError
                      ? "Unable to load advisers"
                      : "Select adviser"}
                  </option>

                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName || t.name || t.email}
                    </option>
                  ))}
                </select>

                {teachersError && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>
                    {teachersError}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.04,
                    color: "#6b7280",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Department
                </label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                  color: "#6b7280",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Keywords (comma-separated)
              </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
                />
              </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                  color: "#6b7280",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Replace PDF (optional)
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
              <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                Upload a new PDF if you are replacing the current document version.
              </div>
            </div>

            <div style={{ marginBottom: 4 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                  color: "#6b7280",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Abstract
              </label>
              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          <footer
            style={{
              padding: "10px 20px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                borderRadius: 999,
                border: "1px solid #d1d5db",
                padding: "6px 14px",
                fontSize: 13,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                borderRadius: 999,
                border: "none",
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 500,
                background: "#111827",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
