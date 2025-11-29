import { useEffect, useState, useMemo, useRef } from "react";
import "../index.css";
import StudentNavbar from "./StudentNavbar.jsx";
import EditThesisModal from "./StudentEditThesisModal.jsx";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function buildDownloadUrl(project) {
  if (!project?._id) return null;
  return `${API}/api/student/projects/${project._id}/download`;
}

// 2PL helpers (front-end)
function getActiveLock(doc) {
  const lock = doc?.editLock;
  if (!lock) return null;
  if (lock.releasedAt) return null;
  if (lock.expiresAt && new Date(lock.expiresAt) < new Date()) return null;
  return lock;
}

export default function Profile({ onLogout = () => { }, onNavigate = () => { } }) {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [err, setErr] = useState("");

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const projectsErrorShownRef = useRef(false);

  // 2PL: to avoid double-click spam on lock
  const [lockBusyId, setLockBusyId] = useState("");

  // ===== LOAD PROFILE =====
  useEffect(() => {
    let abort = false;

    async function fetchMe() {
      try {
        setLoadingMe(true);
        setErr("");
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const user = data?.user || data;
        if (!abort) setMe(user);
      } catch (e) {
        console.error("[STUDENT][PROFILE][ERROR]", e);
        if (!abort) setErr("Failed to load profile.");
      } finally {
        if (!abort) setLoadingMe(false);
      }
    }

    fetchMe();
    return () => {
      abort = true;
    };
  }, []);

  // ===== LOAD MY PROJECTS =====
  async function loadMyCapstones({ fromButton = false } = {}) {
    setLoadingProjects(true);
    try {
      const res = await fetch(`${API}/api/student/projects/mine`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = json.projects || json.thesis || json;
      setProjects(Array.isArray(list) ? list : []);
      projectsErrorShownRef.current = false;
    } catch (e) {
      console.error("[STUDENT][PROJECTS][LOAD][ERROR]", e);
      if (fromButton || !projectsErrorShownRef.current) {
        toast.error("Failed to load your uploaded thesis.");
        projectsErrorShownRef.current = true;
      }
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    loadMyCapstones();
  }, []);

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        const text = `${p.title} ${p.category} ${p.year} ${(p.authors || []).join(
          " "
        )}`.toLowerCase();
        return text.includes(search.toLowerCase());
      }),
    [projects, search]
  );

  const previewUrl = previewItem ? buildDownloadUrl(previewItem) : null;

  // ===== account info for top cards =====
  const primaryEmail = me?.email || "";
  const loginProvider = (me?.provider || me?.loginProvider || "local").toLowerCase();
  const loginMethod =
    loginProvider === "google" ? "Google account" : "Email & password";
  const emailVerified = me?.emailVerified ?? me?.verified ?? false;
  const linkedToGoogle =
    loginProvider === "google" ||
    !!(me?.googleId || me?.isGoogleLinked || me?.googleSub);

  const avatarUrl =
    me?.avatarUrl || me?.picture || me?.photo || me?.googlePhotoUrl || null;

  // ===== Change password handlers =====
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        let msg = "Failed to change password.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch { }
        throw new Error(msg);
      }

      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
    } catch (err) {
      console.error("[STUDENT][CHANGE_PASSWORD][ERROR]", err);
      toast.error(err.message || "Failed to change password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  function closePasswordModal() {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  // ===== 2PL: lock & unlock for student edit =====
  async function lockProjectForEdit(project) {
    try {
      setLockBusyId(project._id);
      const res = await fetch(
        `${API}/api/student/projects/${project._id}/lock`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (res.status === 423) {
        toast.error("This thesis is currently being edited by someone else.");
        return null;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `Failed to lock project (HTTP ${res.status})`);
      }

      const data = await res.json();
      return data.project || project;
    } catch (err) {
      console.error("[STUDENT][LOCK][ERROR]", err);
      toast.error(err.message || "Failed to lock thesis for editing.");
      return null;
    } finally {
      setLockBusyId("");
    }
  }

  async function unlockProject(projectId) {
    if (!projectId) return;
    try {
      await fetch(`${API}/api/student/projects/${projectId}/unlock`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error("[STUDENT][UNLOCK][ERROR]", err);
    }
  }

  async function handleOpenEdit(project) {
    // If locked by someone else, block
    const activeLock = getActiveLock(project);
    if (activeLock && activeLock.lockedBy !== me?._id) {
      toast.error("This thesis is currently being edited by someone else.");
      return;
    }

    const locked = await lockProjectForEdit(project);
    if (!locked) return;

    // Open modal on success
    setEditItem(locked);
  }

  async function handleCloseEditModal() {
    if (editItem?._id) {
      await unlockProject(editItem._id);
    }
    setEditItem(null);
  }

  return (
    <>
      <StudentNavbar onLogout={onLogout} onNavigate={onNavigate} />
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg,#f3f4ff,#ffffff)",
          padding: "32px 40px 80px",
        }}
      >
        {/* TOP ROW: profile + account */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: "24px",
            marginBottom: "32px",
            maxWidth: 1150,
            marginInline: "auto",
          }}
        >
          {/* My Profile card */}
          <section
            style={{
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
              padding: "20px 24px 24px",
            }}
          >
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    margin: 0,
                    color: "#111827",
                  }}
                >
                  My Profile
                </h2>
                <p
                  style={{
                    margin: 0,
                    marginTop: 4,
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  Basic information about your student account.
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#eef2ff",
                  color: "#4f46e5",
                  textTransform: "uppercase",
                  letterSpacing: 0.05,
                }}
              >
                Student
              </span>
            </header>

            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    objectFit: "cover",
                    boxShadow: "0 10px 20px rgba(15,23,42,0.25)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background:
                      "linear-gradient(135deg,#4f46e5,#6366f1,#a855f7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 26,
                    fontWeight: 700,
                  }}
                >
                  {me ? getInitials(me.name || me.fullName || me.email) : "SF"}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {loadingMe ? "Loading…" : me?.name || me?.fullName || "—"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {primaryEmail || "—"}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Joined:{" "}
                  <strong>
                    {me?.createdAt
                      ? new Date(me.createdAt).toLocaleDateString()
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>

            {err && (
              <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 8 }}>
                {err}
              </p>
            )}
          </section>

          {/* Account & Sign-in card  */}
          <section className="account-card">
            <h2 className="account-card__title">Account &amp; Sign-in</h2>
            <p className="account-card__subtitle">
              Manage how you log in to BukSU CoT Repository.
            </p>

            <div className="account-info-box">
              <div className="account-row">
                <span className="account-row__label">Primary email</span>
                <span className="account-row__value">
                  {primaryEmail || "—"}
                </span>
              </div>

              <div className="account-row">
                <span className="account-row__label">Login method</span>
                <span className="account-row__value">{loginMethod}</span>
              </div>

              <div className="account-row">
                <span className="account-row__label">Email verified</span>
                <span className="account-row__value">
                  {emailVerified ? "Yes" : "No"}
                </span>
              </div>

              {loginProvider !== "google" && (
                <div className="account-change-password">
                  <button
                    type="button"
                    className="change-password-link"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change password
                  </button>
                </div>
              )}
            </div>

            {linkedToGoogle && (
              <div className="account-linked-google">
                <div className="account-linked-google__title">
                  Linked to Google
                </div>
                <div>
                  Your profile is already linked to a Google account. You can
                  continue signing in with Google, or with email and password
                  (if you set one).
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ===== MY UPLOADED THESIS TABLE ===== */}
        <section
          style={{
            maxWidth: 1150,
            marginInline: "auto",
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 10px 30px rgba(15,23,42,0.07)",
            padding: "20px 24px 26px",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                My Uploaded Thesis
              </h2>
              <p
                style={{
                  margin: 0,
                  marginTop: 4,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                View the capstone projects you have submitted and their status.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, year, author…"
                style={{
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  padding: "6px 12px",
                  fontSize: 13,
                  minWidth: 220,
                }}
              />
              <button
                onClick={() => loadMyCapstones({ fromButton: true })}
                disabled={loadingProjects}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {loadingProjects ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </header>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={{ padding: "8px 4px", width: 360 }}>Title</th>
                  <th style={{ padding: "8px 4px" }}>Year</th>
                  <th style={{ padding: "8px 4px" }}>Category</th>
                  <th style={{ padding: "8px 4px" }}>Status</th>
                  <th style={{ padding: "8px 4px", width: 260 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const status = p.status || "pending";
                  const statusBg =
                    status === "approved"
                      ? "#ecfdf3"
                      : status === "rejected"
                        ? "#fef2f2"
                        : "#eff6ff";
                  const statusColor =
                    status === "approved"
                      ? "#166534"
                      : status === "rejected"
                        ? "#b91c1c"
                        : "#1d4ed8";

                  const activeLock = getActiveLock(p);
                  const lockedByOther =
                    activeLock && activeLock.lockedBy !== me?._id;

                  return (
                    <tr
                      key={p._id}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "8px 4px" }}>{p.title}</td>
                      <td style={{ padding: "8px 4px" }}>{p.year || "—"}</td>
                      <td style={{ padding: "8px 4px" }}>
                        {p.category || p.department || "—"}
                      </td>
                      <td style={{ padding: "8px 4px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            textTransform: "capitalize",
                            background: statusBg,
                            color: statusColor,
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: "8px 4px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            disabled={
                              lockBusyId === p._id ||
                              lockedByOther ||
                              status === "approved"
                            }
                            style={{
                              borderRadius: 999,
                              border: "none",
                              padding: "5px 10px",
                              fontSize: 12,
                              background: "#111827",
                              color: "#fff",
                              cursor: "pointer",
                              opacity:
                                lockBusyId === p._id || lockedByOther
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            ✎ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = buildDownloadUrl(p);
                              if (!url) {
                                toast.error(
                                  "No PDF file found for this thesis."
                                );
                                return;
                              }
                              window.open(
                                url,
                                "_blank",
                                "noopener,noreferrer"
                              );
                              setPreviewItem(p);
                            }}
                            style={{
                              borderRadius: 999,
                              border: "1px solid #e5e7eb",
                              padding: "5px 10px",
                              fontSize: 12,
                              background: "#fff",
                              color: "#111827",
                              cursor: "pointer",
                            }}
                          >
                            📄 View PDF
                          </button>
                          {lockedByOther && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#b91c1c",
                                marginLeft: 4,
                              }}
                            >
                              Editing is temporarily locked.
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filtered.length && !loadingProjects && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "16px 4px",
                        textAlign: "center",
                        fontSize: 13,
                        color: "#9ca3af",
                      }}
                    >
                      You haven&apos;t uploaded any thesis yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Edit thesis modal */}
        {editItem && (
          <EditThesisModal
            item={editItem}
            onClose={handleCloseEditModal}
            onSaved={async (updated) => {
              setProjects((prev) =>
                prev.map((p) => (p._id === updated._id ? updated : p))
              );
              toast.success("Your thesis was updated.");
              await unlockProject(updated._id);
              setEditItem(null);
            }}
          />
        )}

        {/* Change password modal */}
        {showPasswordModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.55)",
              zIndex: 1100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={closePasswordModal}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <header
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <strong>Change password</strong>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </header>

              <form onSubmit={handlePasswordSubmit}>
                <div style={{ padding: "14px 16px 6px" }}>
                  <div style={{ marginBottom: 10 }}>
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
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 10 }}>
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
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                      }}
                    />
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
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                <footer
                  style={{
                    padding: "10px 16px",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    disabled={savingPassword}
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
                    disabled={savingPassword}
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
                    {savingPassword ? "Saving…" : "Save password"}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}

        {/* PDF preview overlay */}
        {previewItem && previewUrl && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={() => setPreviewItem(null)}
          >
            <div
              style={{
                padding: "8px 16px",
                background: "#111",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {previewItem.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{
                  border: "none",
                  background: "#fff",
                  color: "#111",
                  borderRadius: 999,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ flex: 1 }} onClick={(e) => e.stopPropagation()}>
              <iframe
                title="Thesis PDF (Student View)"
                src={`${previewUrl}#toolbar=1`}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  background: "#333",
                }}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
