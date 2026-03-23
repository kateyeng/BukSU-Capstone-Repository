import { useEffect, useState } from "react";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const DEFAULT_SETTINGS = {
  emailOnApprove: true,
  emailOnReject: true,
  emailOnGrade: true,
  emailOnComment: true,
  emailOnBackup: true,
  emailOnSystemEvent: false,
  digestFrequency: "real-time",
  pushEnabled: true,
};

export default function AdminNotifications() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let abort = false;

    async function load() {
      try {
        setLoading(true);

        const [settingsRes, alertsRes] = await Promise.all([
          api.get("/api/notifications/settings", { withCredentials: true }),
          api.get("/api/notifications/admin", { withCredentials: true }),
        ]);

        if (abort) return;

        setSettings({
          ...DEFAULT_SETTINGS,
          ...(settingsRes.data?.settings || {}),
        });
        setAlerts(alertsRes.data?.notifications || []);
      } catch (err) {
        console.error("[ADMIN][NOTIFICATIONS][LOAD][ERROR]", err);
        if (!abort) {
          toast.error("Failed to load notification settings.");
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }

    load();
    return () => {
      abort = true;
    };
  }, []);

  async function saveSettings() {
    try {
      setSaving(true);
      await api.patch("/api/notifications/settings", settings, {
        withCredentials: true,
      });
      toast.success("Notification settings updated.");
    } catch (err) {
      console.error("[ADMIN][NOTIFICATIONS][SAVE][ERROR]", err);
      toast.error(err?.response?.data?.message || "Failed to save notification settings.");
    } finally {
      setSaving(false);
    }
  }

  function toggle(field) {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  if (loading) {
    return <p>Loading notifications…</p>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 className="admin-heading" style={{ marginBottom: 4 }}>Notification Settings</h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
          Control system emails and admin alerts for approvals, backups, and account actions.
        </p>
      </div>

      <div className="admin-card" style={{ padding: 18 }}>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            ["emailOnApprove", "Email on approval"],
            ["emailOnReject", "Email on rejection"],
            ["emailOnComment", "Email on adviser comments"],
            ["emailOnBackup", "Email on backup completion"],
            ["emailOnSystemEvent", "Email on system events"],
            ["pushEnabled", "Enable in-app alerts"],
          ].map(([field, label]) => (
            <label
              key={field}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                paddingBottom: 10,
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={!!settings[field]}
                onChange={() => toggle(field)}
              />
            </label>
          ))}

          <label style={{ display: "grid", gap: 6, maxWidth: 240 }}>
            <span>Digest Frequency</span>
            <select
              value={settings.digestFrequency || "real-time"}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  digestFrequency: e.target.value,
                }))
              }
            >
              <option value="real-time">Real-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Recent Admin Alerts</h3>
        {alerts.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 13 }}>No notifications available.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {alerts.map((alert) => (
              <div
                key={alert._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 600 }}>{alert.message}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                  {String(alert.type || "system").replace(/_/g, " ")} •{" "}
                  {new Date(alert.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
