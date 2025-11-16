// frontend/src/teacher/Uploads.jsx
import { useMemo, useRef, useState } from "react";
import "../index.css";
import { uploadProject } from "../api/teacher/projects"; // ✅ use your API helper

function getAuth() {
  try {
    const keys = ["user", "authUser", "currentUser"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj) return { id: obj._id || obj.id || null, role: obj.role || null };
    }
  } catch {}
  return { id: null, role: null };
}

export default function Upload({ onLogout = () => {}, onNavigate = () => {} }) {
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [adviser, setAdviser] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [file, setFile] = useState(null);
  const fileInput = useRef(null);

  const pct = useMemo(() => (step === 1 ? 33 : step === 2 ? 67 : 100), [step]);

  const depts = [
    "Information Technology",
    "Automotive",
    "Entertainment and Multimedia Computing",
  ];

  const years = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type !== "application/pdf") return alert("Please upload a PDF file.");
      if (f.size > 50 * 1024 * 1024) return alert("Max size is 50MB.");
      setFile(f);
    }
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") return alert("Please upload a PDF file.");
    if (f.size > 50 * 1024 * 1024) return alert("Max size is 50MB.");
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (
      !title ||
      !authors ||
      !adviser ||
      !department ||
      !year ||
      !abstract ||
      !keywords ||
      !file
    ) {
      alert("Please complete all required fields.");
      return;
    }

    try {
      const { id: userId } = getAuth(); // optional, backend mainly uses session

      // ✅ use axios helper → POST /api/teacher/projects (multipart/form-data)
      const res = await uploadProject({
        title,
        category: department,  // department used as category
        year,
        abstract,
        authors,
        adviser,
        department,
        keywords,
        file,
        status: "pending",
        owner: userId,         // backend can ignore if not needed
      });

      const data = res?.data || {};

      // Cloudinary/DB response – project doc with filePath
      const fileUrl =
        data?.filePath ||
        data?.file?.secure_url ||
        data?.project?.filePath ||
        null;

      if (fileUrl) {
        alert(`Thesis submitted and uploaded.\n\nFile URL:\n${fileUrl}`);
      } else {
        alert(
          "Thesis submitted for approval. You'll see it after an admin approves it."
        );
      }

      onNavigate("dashboard");
    } catch (err) {
      console.error("Upload error:", err?.response?.data || err.message);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        "Upload failed";
      alert(msg);
    }
  };

  const go = (dest) => (e) => {
    e?.preventDefault();
    onNavigate(dest);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div
          className="logo-area"
          onClick={go("dashboard")}
          style={{ cursor: "pointer" }}
        >
          <div className="logo-square" />
          <div>
            <div className="logo-title">BukSU CoT</div>
            <div className="logo-subtitle">Thesis Realm</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#" onClick={go("dashboard")}>
            Home
          </a>
          <a href="#" onClick={go("browse")}>
            Browse
          </a>
          <a href="#" className="active" onClick={(e) => e.preventDefault()}>
            Upload
          </a>
          <a href="#" onClick={go("about")}>
            About
          </a>
          <a href="#" onClick={go("contact")}>
            Contact
          </a>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      <div className="upload-page">
        <div className="stepper">
          <div className="stepper-top">
            <span>Step {step} of 3</span>
            <span className="pct">{pct}%</span>
          </div>
          <div className="progress-rail">
            <div className="progress-bar" style={{ width: pct + "%" }} />
          </div>
          <div className="stepper-labels">
            <span className={step >= 1 ? "active" : ""}>Basic Info</span>
            <span className={step >= 2 ? "active" : ""}>Details</span>
            <span className={step >= 3 ? "active" : ""}>Upload File</span>
          </div>
        </div>

        <form className="form-card" onSubmit={submit}>
          {step === 1 && (
            <>
              <div className="field">
                <label>
                  Thesis Title <span className="req">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your thesis title"
                />
              </div>
              <div className="field">
                <label>
                  Authors <span className="req">*</span>
                </label>
                <input
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g., Juan Dela Cruz, Maria Santos"
                />
                <small>Separate multiple authors with commas</small>
              </div>
              <div className="field">
                <label>
                  Thesis Adviser <span className="req">*</span>
                </label>
                <input
                  value={adviser}
                  onChange={(e) => setAdviser(e.target.value)}
                  placeholder="e.g., Dr. Roberto P. Gonzales"
                />
              </div>
              <div className="hr" />
              <div className="actions">
                <button type="button" className="btn-ghost" disabled>
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={next}
                >
                  Next Step
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="two-col">
                <div className="field">
                  <label>
                    Department <span className="req">*</span>
                  </label>
                  <div className="select-wrap">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="" disabled>
                        Select department
                      </option>
                      {depts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <svg className="chev" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M7 10l5 5l5-5z" />
                    </svg>
                  </div>
                </div>
                <div className="field">
                  <label>
                    Year <span className="req">*</span>
                  </label>
                  <div className="select-wrap">
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    >
                      <option value="" disabled>
                        Select year
                      </option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <svg className="chev" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M7 10l5 5l5-5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="field">
                <label>
                  Abstract <span className="req">*</span>
                </label>
                <textarea
                  rows="6"
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Enter your thesis abstract (200–500 words)"
                />
              </div>

              <div className="field">
                <label>
                  Keywords <span className="req">*</span>
                </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., IoT, Smart Agriculture, Water Management"
                />
                <small>
                  Separate keywords with commas (3–7 keywords recommended)
                </small>
              </div>

              <div className="hr" />
              <div className="actions">
                <button type="button" className="btn-ghost" onClick={prev}>
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={next}
                >
                  Next Step
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div
                className="dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInput.current?.click()}
              >
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handleFile}
                />
                <div className="dz-inner">
                  <svg width="38" height="38" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M5 20h14v-8h3L12 3L2 12h3z"
                    />
                  </svg>
                  {file ? (
                    <>
                      <strong>{file.name}</strong>
                      <small>
                        {(file.size / 1024 / 1024).toFixed(1)} MB • PDF
                      </small>
                      <small>
                        Click to replace or drag and drop a new file
                      </small>
                    </>
                  ) : (
                    <>
                      <strong>Click to upload or drag and drop</strong>
                      <small>PDF files only (Max 50MB)</small>
                    </>
                  )}
                </div>
              </div>

              <div className="note">
                <div className="note-title">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M11 7h2v6h-2zm0 8h2v2h-2zM1 21h22L12 2z"
                    />
                  </svg>
                  Before submitting, please ensure:
                </div>
                <ul>
                  <li>All information provided is accurate and complete</li>
                  <li>The PDF is properly formatted and readable</li>
                  <li>You have permission from all co-authors to upload</li>
                  <li>
                    The document meets the university’s formatting guidelines
                  </li>
                </ul>
              </div>

              <div className="hr" />
              <div className="actions">
                <button type="button" className="btn-ghost" onClick={prev}>
                  Previous
                </button>
                <button type="submit" className="btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M3 6h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"
                    />
                  </svg>
                  Submit Thesis
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
