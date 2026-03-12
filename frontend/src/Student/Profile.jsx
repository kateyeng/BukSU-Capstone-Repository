import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

function isGmailAddress(email = "") {
  return String(email).toLowerCase().endsWith("@gmail.com");
}

function buildNameFromEmail(email = "") {
  const local = String(email).split("@")[0] || "";
  if (!local) return "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDownloadUrl(project) {
  if (!project?._id) return null;
  return `${API}/api/student/projects/${project._id}/download`;
}

function getActiveLock(doc) {
  const lock = doc?.editLock;
  if (!lock) return null;
  if (lock.releasedAt) return null;
  if (lock.expiresAt && new Date(lock.expiresAt) < new Date()) return null;
  return lock;
}

function confirmDeleteToast(message) {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div
          style={{
            background: "#ffffff",
            color: "#111827",
            padding: "12px 14px",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
            width: "100%",
            maxWidth: 360,
            fontSize: 13,
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ marginBottom: 8 }}>{message}</div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              style={{
                borderRadius: 999,
                border: "1px solid #d1d5db",
                padding: "4px 10px",
                fontSize: 12,
                background: "#ffffff",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              style={{
                borderRadius: 999,
                border: "none",
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 500,
                background: "#b91c1c",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 100000 }
    );
  });
}

export default function Profile({ onLogout = () => {} }) {
  const navigate = useNavigate();

  const handleNavigate = (dest) => {
    switch (dest) {
      case "dashboard":
        navigate("/student");
        break;
      case "browse":
        navigate("/student/browse");
        break;
      case "upload":
        navigate("/student/uploads");
        break;
      case "about":
        navigate("/student/about");
        break;
      case "contact":
        navigate("/student/contact");
        break;
      case "profile":
        navigate("/student/profile");
        break;
      default:
        navigate("/student");
    }
  };

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [err, setErr] = useState("");

  const [projects, setProjects] = useState([]);
  const [deletedBackups, setDeletedBackups] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [restoringId, setRestoringId] = useState("");

  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const [permissions, setPermissions] = useState({
    project: {
      update: true,
      delete: true,
      download: true,
      create: true,
      read: true,
    },
  });

  const projectsErrorShownRef = useRef(false);
  const [lockBusyId, setLockBusyId] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API}/api/rbac/my-permissions`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (!cancelled && data?.permissions) {
          setPermissions(data.permissions);
        }
      } catch (e) {
        console.error("[Profile][RBAC] failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let abort = false;

    (async () => {
      try {
        setLoadingMe(true);
        setErr("");

        const res = await fetch(`${API}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const user = data?.user || data;

        if (!abort) {
          setMe(user);
          setAvatarBroken(false);
        }
      } catch (e) {
        console.error("[STUDENT][PROFILE][ERROR]", e);
        if (!abort) setErr("Failed to load profile.");
      } finally {
        if (!abort) setLoadingMe(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, []);

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

  async function loadDeletedBackups() {
    setLoadingBackups(true);
    try {
      const res = await fetch(`${API}/api/student/projects/deleted/backups`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setDeletedBackups(Array.isArray(json.backups) ? json.backups : []);
    } catch (e) {
      console.error("[STUDENT][BACKUPS][LOAD][ERROR]", e);
    } finally {
      setLoadingBackups(false);
    }
  }

  useEffect(() => {
    loadMyCapstones();
    loadDeletedBackups();
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const text = `${p.title} ${p.category} ${p.year} ${(p.authors || []).join(
        " "
      )}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [projects, search]);

  const primaryEmail = me?.email || "";
  const hasGmail = isGmailAddress(primaryEmail);

  const displayName =
    me?.name ||
    me?.fullName ||
    (hasGmail ? buildNameFromEmail(primaryEmail) : "") ||
    "—";

  const loginProvider = String(
    me?.provider || me?.loginProvider || "local"
  ).toLowerCase();

  const loginMethod =
    loginProvider === "google" ? "Google account" : "Email & password";

  const emailVerified = !!(
    me?.isEmailVerified ??
    me?.emailVerified ??
    me?.verified ??
    false
  );

  const linkedToGoogle =
    loginProvider === "google" ||
    !!(me?.googleId || me?.isGoogleLinked || me?.googleSub);

  const avatarUrl =
    me?.avatar ||
    me?.profilePic ||
    me?.avatarUrl ||
    me?.picture ||
    me?.photo ||
    me?.googlePhotoUrl ||
    null;

  const resolvedAvatarUrl = avatarUrl
    ? avatarUrl.startsWith("http")
      ? avatarUrl
      : `${API}${avatarUrl}`
    : null;

  const canUpdateProject = !!permissions?.project?.update;
  const canDeleteProject = !!permissions?.project?.delete;
  const canDownloadProject = !!permissions?.project?.download;
  const canRestoreProject = !!permissions?.project?.create;

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploadingAvatar(true);

      const res = await fetch(`${API}/api/auth/upload-avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to upload profile image");
      }

      setMe((prev) => ({
        ...(prev || {}),
        ...(data.user || {}),
        avatar: data.avatar || data.user?.avatar || "",
      }));

      setAvatarBroken(false);
      toast.success(data?.message || "Profile image uploaded successfully");
    } catch (error) {
      console.error("[STUDENT][AVATAR_UPLOAD][ERROR]", error);
      toast.error(error.message || "Failed to upload profile image");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function deleteMyProject(project) {
    if (!canDeleteProject) {
      toast.error("Delete permission is disabled by admin.");
      return;
    }

    if (!project?._id) return;

    const ok = await confirmDeleteToast(
      `Are you sure you want to delete "${project.title}"? A backup will be saved and you can restore it later.`
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API}/api/student/projects/${project._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setProjects((prev) => prev.filter((p) => p._id !== project._id));
      if (previewItem?._id === project._id) setPreviewItem(null);

      toast.success("Thesis deleted. Backup saved.");
      await loadDeletedBackups();
    } catch (err) {
      console.error("[STUDENT][PROJECTS][DELETE][ERROR]", err);
      toast.error("Failed to delete thesis.");
    }
  }

  async function restoreDeletedBackup(backup) {
    if (!canRestoreProject) {
      toast.error("Restore permission is disabled by admin.");
      return;
    }

    try {
      setRestoringId(backup._id);

      const res = await fetch(
        `${API}/api/student/projects/deleted/backups/${backup._id}/restore`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      toast.success("Thesis restored successfully.");
      await loadMyCapstones();
      await loadDeletedBackups();
    } catch (err) {
      console.error("[STUDENT][BACKUP][RESTORE][ERROR]", err);
      toast.error(err.message || "Failed to restore thesis.");
    } finally {
      setRestoringId("");
    }
  }

  async function lockProjectForEdit(project) {
    try {
      setLockBusyId(project._id);

      const res = await fetch(`${API}/api/student/projects/${project._id}/lock`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.status === 423) {
        toast.error("This thesis is currently being edited by someone else.");
        return null;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          json.message || `Failed to lock project (HTTP ${res.status})`
        );
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
    if (!canUpdateProject) {
      toast.error("Edit permission is disabled by admin.");
      return;
    }

    const activeLock = getActiveLock(project);
    if (activeLock && activeLock.lockedBy !== me?._id) {
      toast.error("This thesis is currently being edited by someone else.");
      return;
    }

    const locked = await lockProjectForEdit(project);
    if (!locked) return;

    setEditItem(locked);
  }

  async function handleCloseEditModal() {
    if (editItem?._id) await unlockProject(editItem._id);
    setEditItem(null);
  }

  return (
    <>
      <StudentNavbar onLogout={onLogout} onNavigate={handleNavigate} user={me} />

      <main
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          padding: "32px 40px 80px",
        }}
      >
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
          <section
            style={{
              background: "#ffffff",
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
              {resolvedAvatarUrl && !avatarBroken ? (
                <img
                  src={resolvedAvatarUrl}
                  alt="Profile"
                  onError={() => setAvatarBroken(true)}
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
                    background: "linear-gradient(135deg,#4f46e5,#6366f1,#a855f7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 26,
                    fontWeight: 700,
                    boxShadow: "0 10px 20px rgba(15,23,42,0.25)",
                    flexShrink: 0,
                  }}
                >
                  {me ? getInitials(displayName || me.email) : "SF"}
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
                  {loadingMe ? "Loading…" : displayName}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {primaryEmail || "—"} {hasGmail ? "(Gmail)" : ""}
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

                <div style={{ marginTop: 12 }}>
                  <label
                    htmlFor="avatarUpload"
                    style={{
                      display: "inline-block",
                      borderRadius: 999,
                      border: "1px solid #d1d5db",
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      background: "#ffffff",
                      color: "#111827",
                      cursor: uploadingAvatar ? "not-allowed" : "pointer",
                      opacity: uploadingAvatar ? 0.7 : 1,
                    }}
                  >
                    {uploadingAvatar ? "Uploading..." : "Upload Profile Photo"}
                  </label>

                  <input
                    id="avatarUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>

            {err && (
              <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 8 }}>
                {err}
              </p>
            )}
          </section>

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

        <section
          style={{
            maxWidth: 1150,
            marginInline: "auto",
            background: "#ffffff",
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
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
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
                  background: "#ffffff",
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
                  color: "#ffffff",
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
                            background:
                              status === "approved"
                                ? "#ecfdf3"
                                : status === "rejected"
                                ? "#fef2f2"
                                : "#eff6ff",
                            color:
                              status === "approved"
                                ? "#166534"
                                : status === "rejected"
                                ? "#b91c1c"
                                : "#1d4ed8",
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
                          {canUpdateProject && (
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
                                color: "#ffffff",
                                cursor: "pointer",
                                opacity:
                                  lockBusyId === p._id || lockedByOther ? 0.5 : 1,
                              }}
                            >
                              ✎ Edit
                            </button>
                          )}

                          {canDownloadProject && (
                            <button
                              type="button"
                              onClick={() => {
                                const url = buildDownloadUrl(p);
                                if (!url) {
                                  return toast.error(
                                    "No PDF file found for this thesis."
                                  );
                                }
                                window.open(url, "_blank", "noopener,noreferrer");
                                setPreviewItem(p);
                              }}
                              style={{
                                borderRadius: 999,
                                border: "1px solid #e5e7eb",
                                padding: "5px 10px",
                                fontSize: 12,
                                background: "#ffffff",
                                color: "#111827",
                                cursor: "pointer",
                              }}
                            >
                              📄 View PDF
                            </button>
                          )}

                          {canDeleteProject && (
                            <button
                              type="button"
                              onClick={() => deleteMyProject(p)}
                              style={{
                                borderRadius: 999,
                                border: "1px solid #fecaca",
                                padding: "5px 10px",
                                fontSize: 12,
                                background: "#fef2f2",
                                color: "#b91c1c",
                                cursor: "pointer",
                              }}
                            >
                              🗑 Delete
                            </button>
                          )}

                          {lockedByOther && canUpdateProject && (
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

        <section
          style={{
            maxWidth: 1150,
            marginInline: "auto",
            marginTop: 24,
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 10px 30px rgba(15,23,42,0.07)",
            padding: "20px 24px 26px",
          }}
        >
          <header style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Deleted Thesis Backups
            </h2>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              Restore thesis that you previously deleted.
            </p>
          </header>

          {loadingBackups ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>Loading backups...</p>
          ) : deletedBackups.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              No deleted thesis backups found.
            </p>
          ) : (
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
                    <th style={{ padding: "8px 4px" }}>Title</th>
                    <th style={{ padding: "8px 4px" }}>Year</th>
                    <th style={{ padding: "8px 4px" }}>Category</th>
                    <th style={{ padding: "8px 4px" }}>Deleted At</th>
                    <th style={{ padding: "8px 4px", width: 160 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedBackups.map((b) => {
                    const p = b.projectData || {};
                    return (
                      <tr
                        key={b._id}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <td style={{ padding: "8px 4px" }}>{p.title || "—"}</td>
                        <td style={{ padding: "8px 4px" }}>{p.year || "—"}</td>
                        <td style={{ padding: "8px 4px" }}>
                          {p.category || p.department || "—"}
                        </td>
                        <td style={{ padding: "8px 4px" }}>
                          {b.deletedAt
                            ? new Date(b.deletedAt).toLocaleString()
                            : "—"}
                        </td>
                        <td style={{ padding: "8px 4px" }}>
                          <button
                            type="button"
                            onClick={() => restoreDeletedBackup(b)}
                            disabled={restoringId === b._id || !canRestoreProject}
                            style={{
                              borderRadius: 999,
                              border: "none",
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              background: "#166534",
                              color: "#ffffff",
                              cursor: "pointer",
                              opacity:
                                restoringId === b._id || !canRestoreProject
                                  ? 0.6
                                  : 1,
                            }}
                          >
                            {restoringId === b._id ? "Restoring..." : "Restore"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {editItem && canUpdateProject && (
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

        <section
          style={{
            maxWidth: 1150,
            marginInline: "auto",
            marginTop: 32,
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 10px 30px rgba(15,23,42,0.07)",
            padding: "20px 24px",
            border: "1px solid #fee2e2",
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#991b1b",
              marginBottom: 6,
            }}
          >
            Account Actions
          </h3>

          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 14,
              maxWidth: 600,
            }}
          >
            Signing out will end your current session on this device.
          </p>

          <button
            onClick={onLogout}
            style={{
              borderRadius: 999,
              border: "1px solid #fecaca",
              padding: "8px 18px",
              fontSize: 14,
              fontWeight: 600,
              background: "#fef2f2",
              color: "#b91c1c",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </section>
      </main>
    </>
  );
}