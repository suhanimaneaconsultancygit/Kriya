import { useEffect, useState } from "react";
import { Avatar, RoleBadge, StatusBadge, PriorityBadge, Spinner, Empty, Modal } from "../components/common/UI";
import { TEAM_COLORS, STATUS_LABELS, STATUS_STYLES, formatDate, isOverdue } from "../utils/constants";
import api from "../utils/api";

// ─── USER DETAIL MODAL ────────────────────────────────────────────────────────
function UserDetailModal({ open, onClose, userId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    api.get(`/users/${userId}/tasks`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, userId]);

  if (!open) return null;

  const user  = data?.user;
  const tasks = data?.tasks || [];
  const done  = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.filter((t) => t.status !== "done").length;
  const pct   = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Member Details" width={620}>
      {loading ? (
        <Spinner center size={28} />
      ) : !user ? (
        <Empty icon="👤" title="User not found" />
      ) : (
        <div>
          {/* User header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "var(--gray-50)", borderRadius: 12, marginBottom: 20 }}>
            <Avatar user={user} size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--gray-900)", marginBottom: 4 }}>{user.name}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <RoleBadge role={user.role} />
                {user.team && (
                  <span style={{ fontSize: 12, color: "var(--gray-500)" }}>📂 {user.team}</span>
                )}
                <span style={{ fontSize: 12, color: "var(--gray-400)" }}>✉️ {user.email}</span>
              </div>
            </div>
          </div>

          {/* Task stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total",      value: tasks.length, color: "#6366F1", bg: "#EEF2FF" },
              { label: "Done",       value: done,         color: "#10B981", bg: "#F0FDF4" },
              { label: "Pending",    value: pending,      color: "#F59E0B", bg: "#FFFBEB" },
              { label: "Completion", value: pct + "%",    color: "#8B5CF6", bg: "#F5F3FF" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ textAlign: "center", padding: "12px 8px", background: bg, borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-500)" }}>Overall Progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-900)" }}>{done}/{tasks.length} completed</span>
            </div>
            <div className="progress-track" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: pct + "%", background: "linear-gradient(90deg,#6366F1,#8B5CF6)" }} />
            </div>
          </div>

          {/* Task list */}
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            All Tasks ({tasks.length})
          </h4>
          {tasks.length === 0 ? (
            <Empty icon="📋" title="No tasks assigned" subtitle="This member has no tasks yet" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {tasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <div key={task._id} style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: overdue ? "#FFF5F5" : "var(--gray-50)",
                    border: `1px solid ${overdue ? "#FECACA" : "var(--gray-100)"}`,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {task.title}
                        {task.assignedBy?._id === task.assignedTo && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: "#EEF2FF", color: "#4338CA", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>Self</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
                        Due {formatDate(task.dueDate)}
                        {overdue && <span style={{ color: "var(--danger)", fontWeight: 600 }}> · Overdue</span>}
                        {task.assignedBy && <span> · by {task.assignedBy.name}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── TEAM DETAIL PANEL ────────────────────────────────────────────────────────
function TeamPanel({ teamData, onSelectUser }) {
  const [expanded, setExpanded] = useState(false);
  const { teamName, lead, members } = teamData;
  const color   = TEAM_COLORS[teamName] || "#6366F1";
  const allMembers = members || [];
  const totalTasks = (lead?.taskStats?.total || 0) + allMembers.reduce((s, m) => s + (m.taskStats?.total || 0), 0);
  const doneTasks  = (lead?.taskStats?.done  || 0) + allMembers.reduce((s, m) => s + (m.taskStats?.done  || 0), 0);
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid var(--gray-100)", overflow: "hidden", marginBottom: 14 }}>
      {/* Team header — clickable to expand */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          padding: "16px 20px", cursor: "pointer",
          borderLeft: `5px solid ${color}`,
          display: "flex", alignItems: "center", gap: 14,
          background: expanded ? "var(--gray-50)" : "#fff",
          transition: "background 0.15s",
        }}
      >
        {/* Team icon */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {{ "Web Development": "💻", "Marketing": "📣", "Designing": "🎨", "Interns": "🌱", "SEO": "🔍", "AI Quality": "🤖" }[teamName] || "📂"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--gray-900)" }}>{teamName}</span>
            <span style={{ fontSize: 11, background: color + "18", color, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
              {allMembers.length + (lead ? 1 : 0)} members
            </span>
          </div>

          {/* Team lead line */}
          {lead ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Avatar user={lead} size={20} />
              <span style={{ fontSize: 12, color: "var(--gray-600)", fontWeight: 600 }}>Lead: {lead.name}</span>
              <span style={{ fontSize: 11, color: "var(--gray-400)" }}>· {lead.taskStats?.total || 0} tasks</span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "var(--gray-400)" }}>No team lead assigned</span>
          )}
        </div>

        {/* Progress */}
        <div style={{ textAlign: "right", minWidth: 110, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: "var(--gray-400)", marginBottom: 4 }}>{doneTasks}/{totalTasks} done</div>
          <div className="progress-track" style={{ width: 110 }}>
            <div className="progress-fill" style={{ width: pct + "%", background: color }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 3 }}>{pct}%</div>
        </div>

        {/* Chevron */}
        <div style={{ fontSize: 18, color: "var(--gray-400)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
          ⌄
        </div>
      </div>

      {/* Expanded member list */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--gray-100)" }}>
          {/* Team Lead row */}
          {lead && (
            <MemberRow
              user={lead}
              isLead
              color={color}
              onSelect={() => onSelectUser(lead._id)}
            />
          )}

          {/* Members */}
          {allMembers.length === 0 && !lead && (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--gray-400)", fontSize: 13 }}>No members in this team yet</div>
          )}
          {allMembers.map((m) => (
            <MemberRow key={m._id} user={m} color={color} onSelect={() => onSelectUser(m._id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MEMBER ROW ───────────────────────────────────────────────────────────────
function MemberRow({ user, isLead, color, onSelect }) {
  const s = user.taskStats || { total: 0, done: 0, in_progress: 0, pending: 0 };
  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;

  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
        cursor: "pointer", transition: "background 0.15s",
        borderBottom: "1px solid var(--gray-50)",
        paddingLeft: isLead ? 20 : 44, // indent members under lead
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar user={user} size={36} />
        {isLead && (
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 14, height: 14, borderRadius: "50%",
            background: color, border: "2px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, color: "#fff", fontWeight: 700,
          }}>★</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)" }}>{user.name}</span>
          <RoleBadge role={user.role} />
          {isLead && (
            <span style={{ fontSize: 10, background: color + "18", color, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>Team Lead</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--gray-400)" }}>✉️ {user.email}</div>
      </div>

      {/* Mini task stats */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {[
          { label: "Total",  val: s.total,       bg: "#EEF2FF", color: "#4338CA" },
          { label: "Done",   val: s.done,        bg: "#F0FDF4", color: "#166534" },
          { label: "Active", val: s.in_progress, bg: "#FFF7ED", color: "#C2410C" },
          { label: "Pending",val: s.pending,     bg: "#F1F5F9", color: "#475569" },
        ].map(({ label, val, bg, color: c }) => (
          <div key={label} style={{ textAlign: "center", minWidth: 40, padding: "4px 6px", background: bg, borderRadius: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{val}</div>
            <div style={{ fontSize: 9, color: "var(--gray-400)", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ minWidth: 80, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: "var(--gray-400)" }}>Progress</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gray-700)" }}>{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: pct + "%", background: color }} />
        </div>
      </div>

      <span style={{ fontSize: 14, color: "var(--gray-300)", flexShrink: 0 }}>›</span>
    </div>
  );
}

// ─── MAIN TEAM PAGE ───────────────────────────────────────────────────────────
export default function Team() {
  const [teams,    setTeams]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selUserId, setSelUser] = useState(null);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    api.get("/users/team-structure")
      .then((r) => setTeams(r.data.teams))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = teams.filter((t) =>
    !search ||
    t.teamName.toLowerCase().includes(search.toLowerCase()) ||
    t.lead?.name.toLowerCase().includes(search.toLowerCase()) ||
    t.members?.some((m) => m.name.toLowerCase().includes(search.toLowerCase()))
  );

  // summary stats across all teams
  const totalMembers = teams.reduce((s, t) => s + (t.members?.length || 0) + (t.lead ? 1 : 0), 0);
  const totalTasks   = teams.reduce((s, t) => {
    return s + (t.lead?.taskStats?.total || 0) + (t.members || []).reduce((ms, m) => ms + (m.taskStats?.total || 0), 0);
  }, 0);
  const doneTasks = teams.reduce((s, t) => {
    return s + (t.lead?.taskStats?.done || 0) + (t.members || []).reduce((ms, m) => ms + (m.taskStats?.done || 0), 0);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Dashboard</h1>
          <p className="page-subtitle">Click a team to expand members · Click a member profile to open their task dashboard</p>
        </div>
        <input
          placeholder="🔍  Search teams or members..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
      </div>

      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        {[
          { label: "Total Teams",   value: teams.length, color: "#6366F1", icon: "🏢" },
          { label: "Total Members", value: totalMembers, color: "#10B981", icon: "👥" },
          { label: "Total Tasks",   value: totalTasks,   color: "#F59E0B", icon: "📋" },
          { label: "Completed",     value: doneTasks,    color: "#8B5CF6", icon: "✅" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ flex: 1, minWidth: 130, background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1.5px solid var(--gray-100)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: "var(--gray-400)", fontWeight: 600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <Spinner center size={32} />
      ) : filtered.length === 0 ? (
        <Empty icon="🏢" title="No teams found" subtitle="No teams match your search" />
      ) : (
        <div>
          {filtered.map((teamData) => (
            <TeamPanel
              key={teamData.teamName}
              teamData={teamData}
              onSelectUser={(uid) => setSelUser(uid)}
            />
          ))}
        </div>
      )}

      <UserDetailModal
        open={!!selUserId}
        userId={selUserId}
        onClose={() => setSelUser(null)}
      />
    </div>
  );
}
