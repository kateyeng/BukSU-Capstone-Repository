// src/Admin/adminDashboard.jsx
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";

const PROJECT_COLORS = ["#22c55e", "#ef4444", "#eab308"]; // approved, rejected, pending
const ROLE_COLORS = ["#3b82f6", "#22c55e", "#a855f7"]; // student, teacher, admin

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        async function fetchMetrics() {
            try {
                setLoading(true);
                const res = await api.get("/api/admin/metrics", {
                    withCredentials: true,
                });
                setMetrics(res.data);
                setErr("");
            } catch (e) {
                setErr(
                    e.response?.data?.message || e.message || "Failed to load metrics"
                );
            } finally {
                setLoading(false);
            }
        }

        fetchMetrics();
    }, []);

    if (loading) return <p>Loading dashboard…</p>;
    if (err) return <p className="admin-error">{err}</p>;
    if (!metrics) return null;

    const {
        users,
        projects,
        totalViews,
        pending,
        approved,
        rejected,
        usersByRole,
    } = metrics;

    const projectData = [
        { name: "Approved", value: approved },
        { name: "Rejected", value: rejected },
        { name: "Pending", value: pending },
    ].filter((d) => d.value > 0);

    // Only student / teacher / admin in chart
    const roleData = [
        { name: "Student", value: usersByRole?.student ?? 0 },
        { name: "Teacher", value: usersByRole?.teacher ?? 0 },
        { name: "Admin", value: usersByRole?.admin ?? 0 },
    ].filter((d) => d.value > 0);

    return (
        <div className="admin-dashboard">
            <h2 className="admin-heading">Dashboard</h2>

            {/* Top summary cards */}
            <div className="admin-grid">
                <StatCard label="Total Users" value={users} />
                <StatCard label="Total Projects" value={projects} />
                <StatCard label="Total Views" value={totalViews} />
                <StatCard label="Pending Projects" value={pending} />
            </div>

            <div className="admin-grid admin-grid-large">
                {/* Projects by status chart */}
                <div className="admin-card">
                    <h3 className="admin-card-title">Projects by Status</h3>
                    <div className="admin-chart">
                        {projectData.length ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={projectData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={90}
                                        label
                                    >
                                        {projectData.map((entry, index) => (
                                            <Cell
                                                key={`cell-p-${index}`}
                                                fill={PROJECT_COLORS[index % PROJECT_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="admin-empty">No project data yet.</p>
                        )}
                    </div>
                </div>

                {/* Users by role chart – no guest */}
                <div className="admin-card">
                    <h3 className="admin-card-title">Users by Role</h3>
                    <div className="admin-chart">
                        {roleData.length ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={90}
                                        label
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell
                                                key={`cell-r-${index}`}
                                                fill={ROLE_COLORS[index % ROLE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="admin-empty">No users found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="admin-card admin-card-small">
            <div className="admin-stat-label">{label}</div>
            <div className="admin-stat-value">{value}</div>
        </div>
    );
}
