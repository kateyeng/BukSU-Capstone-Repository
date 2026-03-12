import { useEffect, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import "../index.css";
import "./teacher.css";
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

export default function TeacherProfile() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [err, setErr] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let abort = false;

    async function loadMe() {
      try {
        setLoadingMe(true);
        setErr("");
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const user = data?.user || data;
        if (!abort) {
          setMe(user);
          setProfileName(user?.name || user?.fullName || "");
        }
      } catch (e) {
        console.error("[TEACHER][PROFILE][LOAD][ERROR]", e);
        if (!abort) setErr("Failed to load profile.");
      } finally {
        if (!abort) setLoadingMe(false);
      }
    }

    loadMe();
    return () => {
      abort = true;
    };
  }, []);

  const primaryEmail = me?.email || "";
  const roleLabel = (me?.role || "teacher")
    .toString()
    .charAt(0)
    .toUpperCase()
    .concat((me?.role || "teacher").toString().slice(1));

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

  const joinedText = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString()
    : "—";

  function openModal() {
    setShowModal(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function closeModal() {
    setShowModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSaveProfile(e) {
    e.preventDefault();

    const trimmedName = profileName.trim();
    const originalName = me?.name || me?.fullName || "";
    const nameChanged = trimmedName && trimmedName !== originalName;

    const wantsPasswordChange =
      currentPassword.length > 0 ||
      newPassword.length > 0 ||
      confirmPassword.length > 0;

    if (wantsPasswordChange) {
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
    }

    if (!nameChanged && !wantsPasswordChange) {
      toast.error("Nothing to update.");
      return;
    }

    setSaving(true);

    try {
      let updatedUser = me;

      if (nameChanged) {
        const res = await fetch(`${API}/api/auth/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ fullName: trimmedName }),
        });

        if (!res.ok) {
          let msg = "Failed to update name.";
          try {
            const data = await res.json();
            if (data?.message) msg = data.message;
          } catch {}
          throw new Error(msg);
        }

        try {
          const data = await res.json();
          updatedUser = data?.user || data || updatedUser;
        } catch {
          updatedUser = { ...(updatedUser || {}), fullName: trimmedName };
        }

        setMe((prev) => ({
          ...(prev || {}),
          ...(updatedUser || {}),
          fullName: updatedUser?.fullName || trimmedName,
          name: updatedUser?.name || updatedUser?.fullName || trimmedName,
        }));
      }

      if (wantsPasswordChange) {
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
          } catch {}
          throw new Error(msg);
        }
      }

      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            user: {
              ...(me || {}),
              fullName: trimmedName,
              name: trimmedName,
            },
          },
        })
      );

      toast.success(
        nameChanged && wantsPasswordChange
          ? "Profile and password updated."
          : nameChanged
          ? "Profile updated."
          : "Password updated."
      );
      closeModal();
    } catch (err) {
      console.error("[TEACHER][PROFILE_UPDATE][ERROR]", err);
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="teacher-layout">
      <Sidebar />

      <main
        className="teacher-main"
        style={{
          background: "#f3f4f6",
          padding: "24px 32px 40px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <section
            style={{
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 10px 30px rgba(15,23,42,0.07)",
              padding: "20px 24px 22px",
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
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    margin: 0,
                    color: "#111827",
                  }}
                >
                  My Profile
                </h1>
                <p
                  style={{
                    margin: 0,
                    marginTop: 4,
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  Manage your account information for the Teacher Panel.
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
                {roleLabel}
              </span>
            </header>

            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 12,
                }}
              >
                {resolvedAvatarUrl ? (
                  <img
                    src={resolvedAvatarUrl}
                    alt="Profile"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      objectFit: "cover",
                      boxShadow: "0 10px 20px rgba(15,23,42,0.2)",
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
                      color: "#ffffff",
                      fontSize: 26,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(me?.name || me?.fullName || me?.email || "T")}
                  </div>
                )}

                <div>
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
                      fontSize: 12,
                      color: "#6b7280",
                      marginTop: 6,
                    }}
                  >
                    Joined: <strong>{joinedText}</strong>
                  </div>
                </div>
              </div>

              {err && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#b91c1c",
                    marginTop: 4,
                  }}
                >
                  {err}
                </p>
              )}

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={openModal}
                  disabled={loadingMe}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "7px 18px",
                    fontSize: 13,
                    fontWeight: 500,
                    background: "#111827",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  Edit profile
                </button>
              </div>
            </div>
          </section>
        </div>

        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.55)",
              zIndex: 1300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={closeModal}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                background: "#ffffff",
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
                  fontSize: 14,
                }}
              >
                <strong>Edit profile</strong>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </header>

              <form onSubmit={handleSaveProfile}>
                <div style={{ padding: "14px 16px 8px" }}>
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
                      Full name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        background: "#ffffff",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginBottom: 10,
                    }}
                  >
                    Leave the password fields empty if you only want to update
                    your name.
                  </p>

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
                        background: "#ffffff",
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
                        background: "#ffffff",
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
                        background: "#ffffff",
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
                    onClick={closeModal}
                    disabled={saving}
                    style={{
                      borderRadius: 999,
                      border: "1px solid #d1d5db",
                      padding: "6px 14px",
                      fontSize: 13,
                      background: "#ffffff",
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
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}