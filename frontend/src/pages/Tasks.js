import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Spinner, Empty } from "../components/common/UI";
import { STATUS_LABELS, PRIORITY_LABELS, TEAMS } from "../utils/constants";
import TaskCard from "../components/tasks/TaskCard";
import TaskForm from "../components/tasks/TaskForm";
import api from "../utils/api";

export default function Tasks() {
  const { user }  = useAuth();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Filters
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPrio,   setFilterPrio]   = useState("");
  const [filterTeam,   setFilterTeam]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterPrio)   params.set("priority", filterPrio);
      if (filterTeam)   params.set("team", filterTeam);
      const { data } = await api.get("/tasks?" + params.toString());
      setTasks(data.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPrio, filterTeam]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (task) => { setEditTask(task); setShowForm(true); };
  const handleClose = () => { setEditTask(null); setShowForm(false); };

  const canCreate = user.role !== "intern" || user.role === "intern"; // everyone can create

  // Group by status for Kanban-style display
  const grouped = {};
  tasks.forEach((t) => {
    if (!grouped[t.status]) grouped[t.status] = [];
    grouped[t.status].push(t);
  });

  const [view, setView] = useState("grid"); // "grid" | "kanban"

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} tasks visible based on your role</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowForm(true); }}>
          + New Task
        </button>
      </div>

      {/* Filters bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <input
            placeholder="🔍  Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 14 }}
          />
        </div>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 140 }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <select value={filterPrio} onChange={(e) => setFilterPrio(e.target.value)} style={{ width: 130 }}>
          <option value="">All Priority</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        {["admin", "sub_admin"].includes(user.role) && (
          <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} style={{ width: 160 }}>
            <option value="">All Teams</option>
            {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        {/* View toggle */}
        <div style={{ display: "flex", border: "1.5px solid var(--gray-200)", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
          {[["grid", "⊞ Grid"], ["kanban", "≡ Kanban"]].map(([v, label]) => (
            <button
              key={v} onClick={() => setView(v)}
              style={{
                padding: "7px 12px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: view === v ? "var(--primary)" : "#fff",
                color: view === v ? "#fff" : "var(--gray-500)",
                transition: "all 0.15s",
              }}
            >{label}</button>
          ))}
        </div>

        {(search || filterStatus || filterPrio || filterTeam) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setFilterStatus(""); setFilterPrio(""); setFilterTeam(""); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <Spinner center size={32} />
      ) : tasks.length === 0 ? (
        <Empty
          icon="📋" title="No tasks found"
          subtitle={search || filterStatus ? "Try adjusting your filters" : "Create your first task to get started"}
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Task</button>}
        />
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onEdit={handleEdit} onDelete={load} onRefresh={load} />
          ))}
        </div>
      ) : (
        /* Kanban view */
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
          {Object.entries(STATUS_LABELS).map(([status, label]) => {
            const cols = grouped[status] || [];
            return (
              <div key={status} style={{ minWidth: 280, flexShrink: 0 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                  padding: "8px 12px", background: "#fff", borderRadius: 10, border: "1.5px solid var(--gray-100)",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-600)" }}>{label}</span>
                  <span style={{ marginLeft: "auto", background: "var(--gray-100)", color: "var(--gray-500)", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{cols.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {cols.map((task) => (
                    <TaskCard key={task._id} task={task} onEdit={handleEdit} onDelete={load} onRefresh={load} />
                  ))}
                  {cols.length === 0 && (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--gray-300)", fontSize: 12, border: "2px dashed var(--gray-200)", borderRadius: 10 }}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskForm
        open={showForm}
        onClose={handleClose}
        onSaved={load}
        task={editTask}
      />
    </div>
  );
}
