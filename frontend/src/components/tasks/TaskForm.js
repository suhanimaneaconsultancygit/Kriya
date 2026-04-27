import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { Modal, Field, Alert, Avatar } from "../common/UI";
import { TEAMS, STATUS_LABELS, PRIORITY_LABELS } from "../../utils/constants";
import api from "../../utils/api";

// ─── VOICE RECORDER COMPONENT ────────────────────────────────────────────────
function VoiceRecorder({ onRecorded, existing }) {
  const [recording,  setRecording]  = useState(false);
  const [recorded,   setRecorded]   = useState(!!existing);
  const [duration,   setDuration]   = useState(0);
  const [playing,    setPlaying]    = useState(false);
  const [audioUrl,   setAudioUrl]   = useState(existing || null);

  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const audioRef    = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          setAudioUrl(base64);
          setRecorded(true);
          onRecorded(base64, duration);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const playAudio = () => {
    if (!audioUrl) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play();
    setPlaying(true);
    audio.onended = () => setPlaying(false);
  };

  const deleteRecording = () => {
    setRecorded(false);
    setAudioUrl(null);
    setDuration(0);
    onRecorded(null, null);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ border: "1.5px dashed var(--gray-200)", borderRadius: 10, padding: "14px 16px", background: "var(--gray-50)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        🎙️ Voice Note (optional)
      </div>

      {!recorded && !recording && (
        <button type="button" onClick={startRecording} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 16px",
          background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 8,
          color: "#DC2626", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC2626", display: "inline-block" }} />
          Start Recording
        </button>
      )}

      {recording && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC2626", animation: "pulse 1s infinite", display: "inline-block" }} />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>Recording {fmt(duration)}</span>
          </div>
          <button type="button" onClick={stopRecording} style={{
            padding: "7px 14px", background: "#DC2626", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>⏹ Stop</button>
        </div>
      )}

      {recorded && audioUrl && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={playAudio} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            background: playing ? "#F0FDF4" : "#EEF2FF",
            border: `1.5px solid ${playing ? "#86EFAC" : "#C4B5FD"}`,
            borderRadius: 8, color: playing ? "#166534" : "#5B21B6",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            {playing ? "⏸ Playing..." : "▶ Play Voice Note"}
          </button>
          <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{fmt(duration)}</span>
          <button type="button" onClick={deleteRecording} style={{
            padding: "7px 10px", background: "#FEF2F2", border: "1.5px solid #FECACA",
            borderRadius: 8, color: "#DC2626", fontSize: 12, cursor: "pointer",
          }}>🗑 Remove</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN TASK FORM ───────────────────────────────────────────────────────────
export default function TaskForm({ open, onClose, onSaved, task }) {
  const { user } = useAuth();
  const isEdit   = !!task;

  const [form, setForm] = useState({
    title: "", description: "", assignedTo: "",
    team: user?.team || TEAMS[0], status: "todo", priority: "medium",
    dueDate: "", statusNote: "",
  });
  const [voiceNote,         setVoiceNote]         = useState(null);
  const [voiceNoteDuration, setVoiceNoteDuration] = useState(null);
  const [assignableUsers,   setAssignable]         = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!open) return;
    api.get("/users/assignable")
      .then((r) => {
        setAssignable(r.data.users);
        if (!isEdit) {
          const self = r.data.users.find((u) => u._id === user?._id);
          setForm((f) => ({ ...f, assignedTo: self?._id || r.data.users[0]?._id || "" }));
        }
      })
      .catch(console.error);
  }, [open]);

  useEffect(() => {
    if (task) {
      setForm({
        title:       task.title        || "",
        description: task.description  || "",
        assignedTo:  task.assignedTo?._id || task.assignedTo || "",
        team:        task.team         || TEAMS[0],
        status:      task.status       || "todo",
        priority:    task.priority     || "medium",
        dueDate:     task.dueDate      ? task.dueDate.slice(0, 10) : "",
        statusNote:  "",
      });
      setVoiceNote(task.voiceNote || null);
      setVoiceNoteDuration(task.voiceNoteDuration || null);
    } else {
      setVoiceNote(null);
      setVoiceNoteDuration(null);
    }
    setError("");
  }, [task, open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Task title is required.");
    if (!form.assignedTo)   return setError("Please select who to assign this task to.");
    if (!form.dueDate)      return setError("Due date is required.");

    setLoading(true);
    try {
      const payload = { ...form, voiceNote, voiceNoteDuration };
      if (isEdit) {
        await api.put(`/tasks/${task._id}`, payload);
        toast.success("Task updated!");
      } else {
        await api.post("/tasks", payload);
        toast.success("Task created!");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Task" : "Create New Task"} width={600}>
      {error && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
          ⚠️ {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <Field label="Task Title" required>
          <input placeholder="What needs to be done?" value={form.title} onChange={set("title")} />
        </Field>

        <Field label="Description">
          <textarea placeholder="Add details, context, acceptance criteria..." value={form.description} onChange={set("description")} style={{ minHeight: 80 }} />
        </Field>

        {/* Voice Note Recorder */}
        <div style={{ marginBottom: 16 }}>
          <VoiceRecorder
            existing={voiceNote}
            onRecorded={(url, dur) => { setVoiceNote(url); setVoiceNoteDuration(dur); }}
          />
        </div>

        <div className="field-row">
          <Field label="Assign To" required>
            <select value={form.assignedTo} onChange={set("assignedTo")}>
              <option value="">Select person...</option>
              {assignableUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u._id === user?._id ? `👤 ${u.name} (Me)` : `${u.name} · ${u.role.replace(/_/g, " ")}${u.team ? ` · ${u.team}` : ""}`}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Team" required>
            <select value={form.team} onChange={set("team")}>
              {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div className="field-row">
          <Field label="Priority">
            <select value={form.priority} onChange={set("priority")}>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Due Date" required>
          <input type="date" value={form.dueDate} onChange={set("dueDate")} min={new Date().toISOString().slice(0, 10)} />
        </Field>

        {isEdit && (
          <Field label="Status Change Note">
            <input placeholder="Why is the status changing? (optional)" value={form.statusNote} onChange={set("statusNote")} />
          </Field>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
            {loading
              ? <span className="loader" style={{ width: 16, height: 16 }} />
              : isEdit ? "Save Changes" : "Create Task"
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}
