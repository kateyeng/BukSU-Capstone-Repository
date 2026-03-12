// src/Admin/RolePermissions.jsx
import { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function RolePermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [grants, setGrants] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchPermissions() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await api.get("/api/admin/rbac", {
        withCredentials: true,
      });

      const {
        roles: roleList = [],
        permissions: permissionList = [],
        grants: grantMap = {},
      } = res.data || {};

      setRoles(roleList);
      setPermissions(permissionList);
      setGrants(grantMap);
    } catch (err) {
      console.error("[RolePermissions][FETCH] error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load role permissions from server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive) return;
      await fetchPermissions();
    })();

    return () => {
      alive = false;
    };
  }, []);

  function togglePermission(role, permission) {
    setGrants((prev) => {
      const current = new Set(prev?.[role] || []);

      if (current.has(permission)) {
        current.delete(permission);
      } else {
        current.add(permission);
      }

      return {
        ...prev,
        [role]: Array.from(current),
      };
    });
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await api.put(
        "/api/admin/rbac",
        { grants },
        { withCredentials: true }
      );

      const {
        roles: roleList = roles,
        permissions: permissionList = permissions,
        grants: grantMap = grants,
      } = res.data || {};

      setRoles(roleList);
      setPermissions(permissionList);
      setGrants(grantMap);

      setSuccess(res?.data?.message || "Permissions updated successfully.");
    } catch (err) {
      console.error("[RolePermissions][SAVE] error:", err);
      setError(
        err?.response?.data?.message || "Failed to save role permissions."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const ok = window.confirm(
      "Reset all role permissions back to default settings?"
    );
    if (!ok) return;

    try {
      setResetting(true);
      setError("");
      setSuccess("");

      const res = await api.post(
        "/api/admin/rbac/reset",
        {},
        { withCredentials: true }
      );

      const {
        roles: roleList = [],
        permissions: permissionList = [],
        grants: grantMap = {},
      } = res.data || {};

      setRoles(roleList);
      setPermissions(permissionList);
      setGrants(grantMap);

      setSuccess(res?.data?.message || "Permissions reset successfully.");
    } catch (err) {
      console.error("[RolePermissions][RESET] error:", err);
      setError(
        err?.response?.data?.message || "Failed to reset role permissions."
      );
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return <p>Loading role permissions…</p>;
  }

  return (
    <div className="admin-permissions-page">
      <div className="admin-permissions-header">
        <div>
          <h2 className="admin-permissions-title">Role Permissions</h2>
          <p className="admin-permissions-desc">
            Control which actions each role can perform in the system.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleReset}
            disabled={resetting || saving}
            className="admin-save-btn"
            style={{
              background: "#ffffff",
              color: "#111827",
              border: "1px solid #d1d5db",
            }}
          >
            {resetting ? "Resetting…" : "Reset Defaults"}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || resetting}
            className="admin-save-btn"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}
      {success && <div className="admin-alert-success">{success}</div>}

      <div className="permissions-table-wrapper">
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Permission</th>
              {roles.map((role) => (
                <th key={role} style={{ textTransform: "capitalize" }}>
                  {role}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {permissions.map((perm) => {
              const [resource, action] = perm.split(":");

              return (
                <tr key={perm}>
                  <td>
                    <div>{action}</div>
                    <div className="permission-resource">{resource}</div>
                  </td>

                  {roles.map((role) => {
                    const roleGrants = grants?.[role] || [];
                    const checked = roleGrants.includes(perm);
                    const isAdminCell = role === "admin";

                    return (
                      <td key={`${perm}-${role}`} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={false}
                          onChange={() => togglePermission(role, perm)}
                          title={
                            isAdminCell
                              ? "Admin permission"
                              : `${role} -> ${perm}`
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="admin-permissions-note">
        These settings are now loaded from and saved to the database, so they
        should still work after restarting the server.
      </p>
    </div>
  );
}