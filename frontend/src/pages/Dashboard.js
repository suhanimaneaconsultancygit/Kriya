import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { StatCard, Avatar, StatusBadge, PriorityBadge, Spinner, Empty } from "../components/common/UI";
import { STATUS_LABELS, STATUS_STYLES, TEAM_COLORS, formatDate, isOverdue, MOOD_OPTIONS } from "../utils/constants";
import api from "../utils/api";
import SpecialDays from "../components/dashboard/SpecialDays";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, tasksRes, reportsRes] = await Promise.all([
          api.get("/tasks/stats"),
          api.get("/tasks?limit=6"),
          api.get("/reports?date=" + new Date().toISOString().slice(0, 10)),
        ]);
        setStats(statsRes.data.stats);
        setTasks(tasksRes.data.tasks.slice(0, 6));
        setReports(reportsRes.data.reports);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner center size={32} />;

  const byStatus = {};
  stats?.byStatus?.forEach((s) => { byStatus[s._id] = s.count; });
  const total   = stats?.total || 0;
  const done    = byStatus.done || 0;
  const pct     = total ? Math.round((done / total) * 100) : 0;
  const overdue = stats?.overdue || 0;

  const todayStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 26 }}>
        <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="page-subtitle">{todayStr} · {user?.team || "All Teams"}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Total Tasks"  value={total}                    icon="📋" color="#6366F1" />
        <StatCard label="In Progress"  value={byStatus.in_progress || 0} icon="⚡" color="#F59E0B" />
        <StatCard label="Completed"    value={done}                      icon="✅" color="#10B981" subtitle={`${pct}% completion`} />
        <StatCard label="Overdue"      value={overdue}                   icon="⚠️" color="#EF4444" />
        <StatCard label="Blocked"      value={byStatus.blocked || 0}     icon="🚫" color="#6B7280" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Status breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Status Overview</h3>
          {Object.entries(STATUS_LABELS).map(([k, label]) => {
            const count = byStatus[k] || 0;
            const pct2  = total ? Math.round((count / total) * 100) : 0;
            const s     = STATUS_STYLES[k];
            return (
              <div key={k} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-600)" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-900)" }}>{count}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: pct2 + "%", background: s.dot }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Team progress - CEO / Manager only */}
        {["admin", "sub_admin"].includes(user?.role) && stats?.byTeam?.length > 0 ? (
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Team Progress</h3>
            {stats.byTeam.map(({ _id: team, total: t, done: d }) => {
              const p = t ? Math.round((d / t) * 100) : 0;
              const c = TEAM_COLORS[team] || "#6366F1";
              return (
                <div key={team} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-700)" }}>{team}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--gray-400)" }}>{d}/{t} done</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: p + "%", background: c }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* My task status for non-admin/sub_admin */
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>My Task Status</h3>
            {Object.entries(STATUS_LABELS).map(([k, label]) => {
              const s = STATUS_STYLES[k];
              return (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--gray-50)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
                    <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)" }}>{byStatus[k] || 0}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Special Days */}
      <SpecialDays />

      {/* Recent Tasks */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Tasks</h3>
          <Link to="/tasks" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
        </div>
        {tasks.length === 0 ? <Empty icon="📋" title="No tasks yet" subtitle="Create your first task to get started" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map((task) => {
              const overdue2 = isOverdue(task.dueDate, task.status);
              return (
                <div key={task._id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  background: overdue2 ? "#FFF5F5" : "var(--gray-50)", borderRadius: 10,
                  border: overdue2 ? "1px solid #FEE2E2" : "1px solid transparent",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>
                      {task.team} · Due {formatDate(task.dueDate)}
                      {overdue2 && <span style={{ color: "var(--danger)", fontWeight: 600 }}> · Overdue</span>}
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.assignedTo && <Avatar user={task.assignedTo} size={26} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's Work Reports */}
      {reports.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Today's Work Reports</h3>
            <Link to="/reports" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 12 }}>
            {reports.map((r) => {
              const mood = MOOD_OPTIONS.find((m) => m.key === r.mood);
              return (
                <div key={r._id} style={{ padding: "14px 16px", background: "var(--gray-50)", borderRadius: 12, border: "1px solid var(--gray-100)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                    <Avatar user={r.user} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-900)" }}>{r.user?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{r.user?.team || r.user?.role}</div>
                    </div>
                    <span style={{ fontSize: 20 }}>{mood?.emoji}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--gray-600)", lineHeight: 1.6, margin: 0 }}>{r.summary}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
