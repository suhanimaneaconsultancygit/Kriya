import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { Avatar, StatusBadge, PriorityBadge, Modal } from "../common/UI";
import { isOverdue, formatDate, STATUS_LABELS } from "../../utils/constants";
import api from "../../utils/api";

// ─── REASSIGN MODAL ───────────────────────────────────────────────────────────
function ReassignModal({ open, onClose, task, onReassigned }) {
  const { user }   = useAuth();
  const [users,    setUsers]    = useState([]);
  const [selUser,  setSelUser]  = useState("");
  const [note,     setNote]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [loaded,   setLoaded]   = useState(false);

  const loadUsers = async () => {
    if (loaded) return;
    try {
      const r = await api.get("/users/assignable");
      // Exclude current assignee
      setUsers(r.data.users.filter((u) => u._id !== task?.assignedTo?._id));
      setLoaded(true);
    } catch { toast.error("Failed to load users"); }
  };

  const handleOpen = () => { if (open) loadUsers(); };
  if (open && !loaded) loadUsers();

  const handleReassign = async () => {
    if (!selUser) return toast.error("Please select a person to reassign to.");
    setLoading(true);
    try {
      await api.put(`/tasks/${task._id}/reassign`, { newAssigneeId: selUser, note });
      toast.success("Task reassigned!");
      onReassigned();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reassign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="🔄 Reassign Task" width={460}>
      <div style={{ background: "var(--gray-50)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--gray-400)", marginBottom: 4 }}>Reassigning</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gray-900)" }}>{task?.title}</div>
        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>
          Currently assigned to: <strong>{task?.assignedTo?.name}</strong>
        </div>
      </div>

      <div className="field">
        <label>Reassign To <span style={{ color: "#EF4444" }}>*</span></label>
        <select value={selUser} onChange={(e) => setSelUser(e.target.value)}>
          <option value="">Select new person...</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} · {u.role.replace(/_/g, " ")}{u.team ? ` · ${u.team}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Reason (optional)</label>
        <input placeholder="Why are you reassigning this task?" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary" onClick={handleReassign} disabled={loading} style={{ flex: 2 }}>
          {loading ? <span className="loader" style={{ width: 16, height: 16 }} /> : "Reassign Task"}
        </button>
      </div>
    </Modal>
  );
}

// ─── VOICE NOTE PLAYER ────────────────────────────────────────────────────────
function VoicePlayer({ src, duration }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggle = () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.play();
      setPlaying(true);
      audio.onended = () => setPlaying(false);
    }
  };

  const fmt = (s) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "";

  return (
    <button
      type="button"
      onClick={toggle}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 10px", borderRadius: 20,
        background: playing ? "#F0FDF4" : "#EEF2FF",
        border: `1.5px solid ${playing ? "#86EFAC" : "#C4B5FD"}`,
        color: playing ? "#166534" : "#5B21B6",
        fontSize: 11, fontWeight: 700, cursor: "pointer",
      }}
    >
      <span>{playing ? "⏸" : "🎙️"}</span>
      <span>{playing ? "Playing..." : "Voice Note"}</span>
      {duration && <span style={{ color: "var(--gray-400)" }}>{fmt(duration)}</span>}
    </button>
  );
}

// ─── MAIN TASK CARD ───────────────────────────────────────────────────────────
export default function TaskCard({ task, onEdit, onRefresh }) {
  const { user }     = useAuth();
  const [updating,   setUpdating]   = useState(false);
  const [showReassign, setReassign] = useState(false);
  const overdue = isOverdue(task.dueDate, task.status);

  const isCreator  = task.assignedBy?._id === user._id || task.assignedBy?._id?.toString() === user._id;
  const isAssignee = task.assignedTo?._id === user._id || task.assignedTo?._id?.toString() === user._id;
  const isAdmin    = ["admin", "sub_admin"].includes(user.role);

  const canEdit     = isCreator || isAdmin;
  const canReassign = isCreator || isAssignee || isAdmin;
  const canDelete   = isCreator || isAdmin;

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      toast.success("Status updated!");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success("Task deleted");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  // Self-assigned badge
  const isSelfAssigned = task.assignedBy?._id?.toString() === task.assignedTo?._id?.toString();

  return (
    <>
      <div
        className="card card-hover"
        style={{
          borderColor: overdue ? "#FEE2E2" : undefined,
          background:  overdue ? "#FFFAFA" : "#fff",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Priority top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "12px 12px 0 0",
          background: { low: "#10B981", medium: "#F59E0B", high: "#F97316", urgent: "#EF4444" }[task.priority] || "#6366F1",
        }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, paddingTop: 6 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--gray-900)", lineHeight: 1.4, flex: 1, marginRight: 8 }}>
            {task.title}
            {isSelfAssigned && (
              <span style={{ marginLeft: 6, fontSize: 10, background: "#EEF2FF", color: "#4338CA", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>Self</span>
            )}
          </h3>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {canEdit     && <button className="btn btn-icon btn-sm" onClick={() => onEdit(task)} title="Edit">✏️</button>}
            {canReassign && <button className="btn btn-icon btn-sm" onClick={() => setReassign(true)} title="Reassign" style={{ background: "#EEF2FF" }}>🔄</button>}
            {canDelete   && <button className="btn btn-icon btn-sm" onClick={handleDelete} title="Delete" style={{ background: "#FEF2F2" }}>🗑️</button>}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p style={{ fontSize: 12, color: "var(--gray-400)", lineHeight: 1.6, marginBottom: 8 }}>
            {task.description.slice(0, 100)}{task.description.length > 100 ? "…" : ""}
          </p>
        )}

        {/* Voice Note */}
        {task.voiceNote && (
          <div style={{ marginBottom: 8 }}>
            <VoicePlayer src={task.voiceNote} duration={task.voiceNoteDuration} />
          </div>
        )}

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {overdue && <span className="badge" style={{ background: "#FEF2F2", color: "#DC2626" }}>⚠ Overdue</span>}
        </div>

        {/* Visibility info — shows both assigner and assignee */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, padding: "8px 10px", background: "var(--gray-50)", borderRadius: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 600, marginBottom: 3 }}>ASSIGNED BY</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Avatar user={task.assignedBy} size={20} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-700)" }}>
                {task.assignedBy?.name}{task.assignedBy?._id === user._id ? " (You)" : ""}
              </span>
            </div>
          </div>
          <div style={{ width: 1, background: "var(--gray-200)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 600, marginBottom: 3 }}>ASSIGNED TO</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Avatar user={task.assignedTo} size={20} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-700)" }}>
                {task.assignedTo?.name}{task.assignedTo?._id === user._id ? " (You)" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Reassignment history */}
        {task.reassignmentHistory?.length > 0 && (
          <div style={{ fontSize: 11, color: "var(--gray-400)", marginBottom: 8, padding: "6px 10px", background: "#FFFBEB", borderRadius: 6, border: "1px solid #FDE68A" }}>
            🔄 Reassigned {task.reassignmentHistory.length}x — last to <strong>{task.assignedTo?.name}</strong>
          </div>
        )}

        {/* Due date + team */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--gray-100)", paddingTop: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "var(--gray-400)" }}>📂 {task.team}</span>
          <div style={{ fontSize: 11, fontWeight: 600, color: overdue ? "var(--danger)" : "var(--gray-600)" }}>
            📅 {formatDate(task.dueDate)}
          </div>
        </div>

        {/* Status quick-update dropdown */}
        <select
          value={task.status}
          onChange={handleStatusChange}
          disabled={updating}
          style={{ fontSize: 12, padding: "6px 10px", border: "1.5px solid var(--gray-200)", borderRadius: 8, background: "#fff", cursor: "pointer", width: "100%" }}
        >
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <ReassignModal
        open={showReassign}
        onClose={() => setReassign(false)}
        task={task}
        onReassigned={onRefresh}
      />
    </>
  );
}
