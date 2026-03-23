import { useEffect, useMemo, useRef, useState } from "react";
import "../index.css";
import { uploadProject } from "../api/student/projects";
import StudentNavbar from "./StudentNavbar.jsx";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import usePermissions from "../hooks/usePermissions";

function getAuth() {
  try {
    const keys = ["user", "authUser", "currentUser"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj) {
        return { id: obj._id || obj.id || null, role: obj.role || null };
      }
    }
  } catch {
    return { id: null, role: null };
  }
  return { id: null, role: null };
}

export default function Upload({
  onLogout = () => {},
  onNavigate = () => {},
}) {
  const { can } = usePermissions();

  const currentYear = new Date().getFullYear();
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [adviser, setAdviser] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState(String(currentYear));
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef(null);

  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [teachersError, setTeachersError] = useState("");

  const pct = useMemo(
    () => (step === 1 ? 33 : step === 2 ? 67 : 100),
    [step]
  );

  const depts = [
    "Information Technology",
    "Automotive",
    "Entertainment and Multimedia Computing",
  ];

  const years = [currentYear, currentYear - 1, currentYear - 2];
  const academicYears = years.map((startYear) => ({
    value: String(startYear),
    label: `${startYear}-${startYear + 1}`,
  }));

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  useEffect(() => {
    let abort = false;

    async function fetchTeachers() {
      try {
        setTeachersLoading(true);
        setTeachersError("");

        const res = await api.get("/api/users/teachers", {
          withCredentials: true,
        });

        const list = res.data?.teachers || res.data || [];
        if (!abort) setTeachers(list);
      } catch (err) {
        console.error("Failed to load teachers:", err?.response?.data || err);
        if (!abort) {
          setTeachersError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load advisers"
          );
        }
      } finally {
        if (!abort) setTeachersLoading(false);
      }
    }

    fetchTeachers();

    return () => {
      abort = true;
    };
  }, []);

  const validateFile = (f) => {
    const isPdfMime = f.type === "application/pdf";
    const isPdfName = /\.pdf$/i.test(f.name || "");
    if (!isPdfMime || !isPdfName) {
      toast.error("Only PDF files are allowed.");
      return false;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("Max size is 50MB.");
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    if (isUploading || !can.projectCreate) return;
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (!validateFile(f)) return;
      setFile(f);
    }
  };

  const handleFile = (e) => {
    if (isUploading || !can.projectCreate) return;
    const f = e.target.files?.[0];
    if (!f) return;
    if (!validateFile(f)) return;
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!can.projectCreate) {
      toast.error("Upload permission has been disabled by admin.");
      return;
    }

    if (isUploading) return;

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
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      setIsUploading(true);
      const { id: userId } = getAuth();

      const uploadPromise = uploadProject({
        title,
        category: department,
        year,
        abstract,
        authors,
        adviser,
        department,
        keywords,
        file,
        status: "pending",
        owner: userId,
      });

      const res = await toast.promise(
        uploadPromise,
        {
          loading: "Uploading thesis...",
          success: "Thesis submitted for approval.",
          error: (err) => {
            const msg =
              err?.response?.data?.error ||
              err?.response?.data?.message ||
              err?.message ||
              "Upload failed";
            return msg;
          },
        },
        { duration: 4000 }
      );

      const data = res?.data || {};
      const fileUrl =
        data?.filePath ||
        data?.file?.secure_url ||
        data?.project?.filePath ||
        null;

      if (fileUrl) {
        console.log("Uploaded file URL:", fileUrl);
      }

      onNavigate("dashboard");
    } catch (err) {
      console.error("Upload error:", err?.response?.data || err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="dashboard">
      <StudentNavbar
        onLogout={onLogout}
        onNavigate={onNavigate}
        active="upload"
      />

      <div className="upload-page">
        {!can.projectCreate && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff7ed",
              color: "#9a3412",
              fontSize: 13,
            }}
          >
            Upload permission is currently disabled by admin.
          </div>
        )}

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
                  disabled={!can.projectCreate}
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
                  disabled={!can.projectCreate}
                />
                <small>Separate multiple authors with commas</small>
              </div>

              <div className="field">
                <label>
                  Thesis Adviser <span className="req">*</span>
                </label>

                <div className="select-wrap">
                  <select
                    value={adviser}
                    onChange={(e) => setAdviser(e.target.value)}
                    disabled={teachersLoading || !!teachersError || !can.projectCreate}
                  >
                    <option value="" disabled>
                      {teachersLoading
                        ? "Loading advisers..."
                        : teachersError
                        ? "Unable to load advisers"
                        : "Select adviser"}
                    </option>

                    {!teachersLoading &&
                      !teachersError &&
                      teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.fullName || t.name || t.email}
                        </option>
                      ))}
                  </select>
                  <svg className="chev" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M7 10l5 5l5-5z" />
                  </svg>
                </div>

                {teachersError && (
                  <small className="error-text">{teachersError}</small>
                )}
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
                  disabled={!can.projectCreate}
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
                      disabled={!can.projectCreate}
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
                      disabled={!can.projectCreate}
                    >
                      <option value="" disabled>
                        Select academic year
                      </option>
                      {academicYears.map((y) => (
                        <option key={y.value} value={y.value}>
                          {y.label}
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
                  disabled={!can.projectCreate}
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
                  disabled={!can.projectCreate}
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
                  disabled={!can.projectCreate}
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
                onClick={() => !isUploading && can.projectCreate && fileInput.current?.click()}
                style={{
                  opacity: can.projectCreate ? 1 : 0.65,
                  cursor: can.projectCreate ? "pointer" : "not-allowed",
                }}
              >
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf"
                  hidden
                  disabled={isUploading || !can.projectCreate}
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
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUploading || !can.projectCreate}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M3 6h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"
                    />
                  </svg>
                  {isUploading ? "Uploading..." : "Submit Thesis"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
