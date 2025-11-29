// src/Admin/RolePermissions.jsx
import { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function RolePermissions() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [grants, setGrants] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load current permissions matrix
    useEffect(() => {
        let abort = false;

        async function fetchPermissions() {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                const res = await api.get("/api/admin/permissions", {
                    withCredentials: true,
                });

                if (abort) return;

                const { roles = [], permissions = [], grants = {} } = res.data || {};
                setRoles(roles);
                setPermissions(permissions);
                setGrants(grants);
            } catch (err) {
                console.error("fetchPermissions error:", err);
                if (!abort) {
                    setError(
                        err.response?.data?.message ||
                        "Failed to load role permissions from server."
                    );
                }
            } finally {
                if (!abort) setLoading(false);
            }
        }

        fetchPermissions();
        return () => {
            abort = true;
        };
    }, []);

    function togglePermission(role, permission) {
        setGrants((prev) => {
            const current = new Set(prev[role] || []);
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

            await api.put(
                "/api/admin/permissions",
                { grants },
                { withCredentials: true }
            );

            setSuccess("Permissions updated successfully.");
        } catch (err) {
            console.error("savePermissions error:", err);
            setError(
                err.response?.data?.message || "Failed to save role permissions."
            );
        } finally {
            setSaving(false);
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

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="admin-save-btn"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
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
                                        const roleGrants = grants[role] || [];
                                        const checked = roleGrants.includes(perm);
                                        return (
                                            <td key={role} style={{ textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => togglePermission(role, perm)}
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
                Changes only affect routes that use{" "}
                <code>requirePermission(resource, action)</code> on the backend.
            </p>
        </div>
    );
}
