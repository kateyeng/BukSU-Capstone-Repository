import { useEffect, useMemo, useState } from "react";
import StudentNavbar from "./StudentNavbar.jsx";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ACTION_OPTIONS = [
  { value: "all", label: "All activity" },
  { value: "upload_project", label: "Uploads" },
  { value: "revise_project", label: "Updates" },
  { value: "delete_project", label: "Deletions" },
  { value: "download_pdf", label: "Downloads" },
  { value: "restore_project_backup", label: "Restores" },
  { value: "view_details", label: "Views" },
];

function getActionLabel(action = "", meta = {}) {
  const status = String(meta.status || "").toLowerCase();

  if (action === "upload_project") return "Upload";
  if (action === "delete_project") return "Delete";
  if (action === "download_pdf") return "Download";
  if (action === "restore_project_backup") return "Restore";
  if (action === "view_details") return "View details";

  if (action === "revise_project") {
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    return "Update";
  }

  return String(action || "activity").replace(/_/g, " ");
}

function getActionColors(action = "", meta = {}) {
  const label = getActionLabel(action, meta).toLowerCase();

  if (label === "approved") {
    return {
      background: "#ecfdf3",
      color: "#166534",
      border: "#bbf7d0",
    };
  }

  if (label === "rejected" || label === "delete") {
    return {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "#fecaca",
    };
  }

  if (label === "download" || label === "view details") {
    return {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
    };
  }

  return {
    background: "#f8fafc",
    color: "#334155",
    border: "#e2e8f0",
  };
}

function getActivityTitle(activity) {
  const meta = activity?.meta || {};
  return (
    meta.title ||
    meta.projectTitle ||
    meta.documentTitle ||
    meta.category ||
    "Repository activity"
  );
}

function getActivityDescription(activity) {
  const meta = activity?.meta || {};
  const status = String(meta.status || "").toLowerCase();

  if (activity.action === "upload_project") {
    return "Submitted a new capstone document for review.";
  }

  if (activity.action === "revise_project") {
    if (status === "approved") {
      return meta.reason
        ? `Your submission was approved. ${meta.reason}`
        : "Your submission was approved.";
    }

    if (status === "rejected") {
      return meta.reason
        ? `Your submission was rejected. ${meta.reason}`
        : "Your submission was rejected and sent back for revision.";
    }

    if (meta.reason) return meta.reason;
    if (meta.changes) return "Updated submission details were recorded.";
    return "Submission updated and sent back for review.";
  }

  if (activity.action === "delete_project") {
    return "This submission was removed from your account.";
  }

  if (activity.action === "restore_project_backup") {
    return "A previously deleted submission was restored.";
  }

  if (activity.action === "download_pdf") {
    return "Downloaded the thesis PDF file.";
  }

  if (activity.action === "view_details") {
    return "Viewed the document details page.";
  }

  return meta.reason || meta.message || "Activity recorded.";
}

function getActivityMeta(activity) {
  const meta = activity?.meta || {};
  const bits = [];

  if (meta.year) bits.push(`Year ${meta.year}`);
  if (meta.category) bits.push(meta.category);
  if (meta.status) bits.push(`Status: ${meta.status}`);
  if (meta.fileSize) bits.push(`${Math.round(Number(meta.fileSize) / 1024)} KB`);
  if (meta.source) bits.push(`Source: ${meta.source}`);

  return bits;
}

function matchesSearch(activity, query) {
  if (!query) return true;

  const haystack = [
    activity.fullName,
    activity.email,
    activity.action,
    getActionLabel(activity.action, activity.meta),
    getActivityTitle(activity),
    getActivityDescription(activity),
    ...(getActivityMeta(activity) || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

async function fetchStudentActivities(action) {
  const params = new URLSearchParams();
  if (action && action !== "all") {
    params.set("action", action);
  }

  const query = params.toString();
  const res = await fetch(
    `${API}/api/student/activity${query ? `?${query}` : ""}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }

  return Array.isArray(data.activities) ? data.activities : [];
}

export default function StudentActivity({
  onLogout = () => {},
  onNavigate = () => {},
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  async function loadActivities(action = selectedAction) {
    try {
      setLoading(true);
      const nextActivities = await fetchStudentActivities(action);
      setActivities(nextActivities);
    } catch (err) {
      console.error("[STUDENT][ACTIVITY][LOAD][ERROR]", err);
      toast.error(err.message || "Failed to load activity history.");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function syncActivities() {
      try {
        setLoading(true);
        const nextActivities = await fetchStudentActivities(selectedAction);
        if (!cancelled) {
          setActivities(nextActivities);
        }
      } catch (err) {
        console.error("[STUDENT][ACTIVITY][LOAD][ERROR]", err);
        if (!cancelled) {
          toast.error(err.message || "Failed to load activity history.");
          setActivities([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void syncActivities();

    return () => {
      cancelled = true;
    };
  }, [selectedAction]);

  const visibleActivities = useMemo(() => {
    const next = activities.filter((activity) =>
      matchesSearch(activity, search)
    );

    next.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return next;
  }, [activities, search, sortOrder]);

  const stats = useMemo(() => {
    const totals = {
      total: activities.length,
      uploads: 0,
      updates: 0,
      downloads: 0,
      destructive: 0,
    };

    for (const activity of activities) {
      if (activity.action === "upload_project") totals.uploads += 1;
      if (activity.action === "revise_project") totals.updates += 1;
      if (activity.action === "download_pdf") totals.downloads += 1;
      if (
        activity.action === "delete_project" ||
        activity.action === "restore_project_backup"
      ) {
        totals.destructive += 1;
      }
    }

    return totals;
  }, [activities]);

  return (
    <>
      <StudentNavbar
        current="activity"
        onLogout={onLogout}
        onNavigate={onNavigate}
      />

      <main
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          padding: "32px 40px 80px",
        }}
      >
        <section
          style={{
            maxWidth: 1150,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 24,
            boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
            padding: "24px 28px 28px",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Activity History
              </h1>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  color: "#64748b",
                  maxWidth: 620,
                  lineHeight: 1.6,
                }}
              >
                Review your uploads, updates, deletions, restores, downloads,
                and document views in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadActivities(selectedAction)}
              disabled={loading}
              style={{
                alignSelf: "flex-start",
                borderRadius: 999,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                padding: "10px 16px",
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: "Total entries", value: stats.total, color: "#0f172a" },
              { label: "Uploads", value: stats.uploads, color: "#1d4ed8" },
              { label: "Updates", value: stats.updates, color: "#7c3aed" },
              { label: "Downloads", value: stats.downloads, color: "#166534" },
              {
                label: "Deletes & restores",
                value: stats.destructive,
                color: "#b45309",
              },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: "14px 16px",
                  background:
                    "linear-gradient(180deg, rgba(248,250,252,0.95), rgba(255,255,255,1))",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: 0.08,
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: 8,
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    lineHeight: 1,
                    fontWeight: 800,
                    color: card.color,
                  }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, action, or status..."
              style={{
                minWidth: 240,
                flex: "1 1 280px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                padding: "10px 14px",
                fontSize: 14,
                color: "#111827",
                outline: "none",
              }}
            />

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              style={{
                borderRadius: 999,
                border: "1px solid #d1d5db",
                padding: "10px 14px",
                fontSize: 14,
                color: "#111827",
                background: "#ffffff",
              }}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                borderRadius: 999,
                border: "1px solid #d1d5db",
                padding: "10px 14px",
                fontSize: 14,
                color: "#111827",
                background: "#ffffff",
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {loading ? (
            <div
              style={{
                borderRadius: 20,
                border: "1px solid #e5e7eb",
                padding: "28px 20px",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Loading your activity history...
            </div>
          ) : visibleActivities.length === 0 ? (
            <div
              style={{
                borderRadius: 20,
                border: "1px dashed #cbd5e1",
                padding: "30px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                No activity found
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 14 }}>
                Try a different filter or keep using the repository and your
                actions will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {visibleActivities.map((activity) => {
                const colors = getActionColors(activity.action, activity.meta);
                const metaBits = getActivityMeta(activity);

                return (
                  <article
                    key={activity._id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 20,
                      padding: "16px 18px",
                      background: "#ffffff",
                      boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: "1 1 420px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              borderRadius: 999,
                              border: `1px solid ${colors.border}`,
                              background: colors.background,
                              color: colors.color,
                              padding: "4px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {getActionLabel(activity.action, activity.meta)}
                          </span>

                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            {new Date(activity.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <h2
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#0f172a",
                            lineHeight: 1.4,
                          }}
                        >
                          {getActivityTitle(activity)}
                        </h2>

                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: 14,
                            color: "#475569",
                            lineHeight: 1.7,
                          }}
                        >
                          {getActivityDescription(activity)}
                        </p>
                      </div>

                      <div
                        style={{
                          minWidth: 220,
                          flex: "0 0 240px",
                          borderRadius: 16,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          padding: "12px 14px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: 0.08,
                            textTransform: "uppercase",
                            color: "#64748b",
                            marginBottom: 8,
                          }}
                        >
                          Details
                        </div>

                        <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                          <div>
                            <strong style={{ color: "#0f172a" }}>User:</strong>{" "}
                            <span style={{ color: "#475569" }}>
                              {activity.fullName || activity.email || "Student"}
                            </span>
                          </div>
                          <div>
                            <strong style={{ color: "#0f172a" }}>Role:</strong>{" "}
                            <span style={{ color: "#475569" }}>
                              {activity.role || "student"}
                            </span>
                          </div>
                          {activity.email ? (
                            <div>
                              <strong style={{ color: "#0f172a" }}>Email:</strong>{" "}
                              <span style={{ color: "#475569" }}>{activity.email}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {metaBits.length ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          marginTop: 14,
                        }}
                      >
                        {metaBits.map((bit) => (
                          <span
                            key={bit}
                            style={{
                              borderRadius: 999,
                              padding: "5px 10px",
                              fontSize: 12,
                              color: "#334155",
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {bit}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
