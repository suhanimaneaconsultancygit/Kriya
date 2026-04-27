import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Avatar, RoleBadge, Modal, Alert, Spinner, Empty } from "../components/common/UI";
import { MOOD_OPTIONS } from "../utils/constants";
import api from "../utils/api";

// ─── REPORT SUBMIT MODAL ──────────────────────────────────────────────────────
function ReportModal({ open, onClose, existing, onSaved }) {
  const [form, setForm] = useState({ summary: "", mood: "good", workData: {} });
  const [tasksWorkedOn, setTasksWorkedOn] = useState("");
  const [blockers,      setBlockers]      = useState("");
  const [tomorrow,      setTomorrow]      = useState("");
  const [hours,         setHours]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (existing) {
      setForm({ summary: existing.summary || "", mood: existing.mood || "good" });
      setTasksWorkedOn((existing.workData?.tasksWorkedOn || []).join(", "));
      setBlockers(existing.workData?.blockers || "");
      setTomorrow(existing.workData?.tomorrow || "");
      setHours(existing.workData?.hoursWorked || "");
    } else {
      setForm({ summary: "", mood: "good" });
      setTasksWorkedOn(""); setBlockers(""); setTomorrow(""); setHours("");
    }
    setError("");
  }, [existing, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.summary.trim()) return setError("Please write a summary of your work today.");
    setLoading(true);
    try {
      // Unstructured workData - can store anything
      const workData = {
        tasksWorkedOn: tasksWorkedOn.split(",").map((s) => s.trim()).filter(Boolean),
        blockers:      blockers || null,
        tomorrow:      tomorrow || null,
        hoursWorked:   hours ? parseFloat(hours) : null,
        submittedAt:   new Date().toISOString(),
      };
      await api.post("/reports", { summary: form.summary, mood: form.mood, workData });
      toast.success("Work report saved!");
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="📋 Today's Work Report" width={540}>
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Summary of today's work <span className="req">*</span></label>
          <textarea
            placeholder="Describe what you accomplished today..."
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            style={{ minHeight: 110 }}
          />
        </div>

        <div className="field">
          <label>Tasks worked on (comma separated)</label>
          <input placeholder="e.g. Hero section redesign, API bug fix" value={tasksWorkedOn} onChange={(e) => setTasksWorkedOn(e.target.value)} />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Blockers / Issues</label>
            <input placeholder="Anything blocking you?" value={blockers} onChange={(e) => setBlockers(e.target.value)} />
          </div>
          <div className="field">
            <label>Hours worked</label>
            <input type="number" min="0" max="24" step="0.5" placeholder="e.g. 7.5" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Plan for tomorrow</label>
          <input placeholder="What will you work on next?" value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} />
        </div>

        <div className="field">
          <label>How was your day?</label>
          <div style={{ display: "flex", gap: 8 }}>
            {MOOD_OPTIONS.map(({ key, emoji, label }) => (
              <button
                key={key} type="button"
                onClick={() => setForm((f) => ({ ...f, mood: key }))}
                style={{
                  flex: 1, padding: "10px 6px", border: `2px solid ${form.mood === key ? "var(--primary)" : "var(--gray-200)"}`,
                  borderRadius: 10, background: form.mood === key ? "var(--primary-light)" : "#fff",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 3 }}>{emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: form.mood === key ? "var(--primary)" : "var(--gray-400)" }}>{label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
            {loading ? <span className="loader" style={{ width: 16, height: 16 }} /> : "Save Report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
export default function Reports() {
  const { user }   = useAuth();
  const [reports,  setReports]  = useState([]);
  const [todayRep, setTodayRep] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set("date", dateFilter);
      const [rRes, tRes] = await Promise.all([
        api.get("/reports?" + params.toString()),
        api.get("/reports/today"),
      ]);
      setReports(rRes.data.reports);
      setTodayRep(tRes.data.report);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Work Reports</h1>
          <p className="page-subtitle">Daily work logs — visible based on your role hierarchy</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 160 }}
          />
          <button
            className={`btn ${todayRep ? "btn-success" : "btn-primary"}`}
            onClick={() => setShowForm(true)}
          >
            {todayRep ? "✅ Edit Today's Report" : "📝 Submit Today's Report"}
          </button>
        </div>
      </div>

      {/* Today's status banner */}
      {!todayRep && (
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>You haven't submitted today's report yet</div>
            <div style={{ fontSize: 12, color: "#B45309" }}>Your manager and leads are waiting for your daily update</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Submit Now</button>
        </div>
      )}

      {loading ? <Spinner center size={28} /> : reports.length === 0 ? (
        <Empty icon="📝" title="No reports found" subtitle={dateFilter ? "No reports for this date" : "No work reports available"} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map((r) => {
            const mood = MOOD_OPTIONS.find((m) => m.key === r.mood);
            const isToday = r.date === todayStr;
            const isOwn   = r.user?._id === user._id || r.user === user._id;
            return (
              <div
                key={r._id}
                className="card"
                style={{
                  borderColor: isToday ? "var(--gray-200)" : undefined,
                  background: isOwn ? "#FAFBFF" : "#fff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Avatar user={r.user} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)" }}>{r.user?.name}</span>
                      <RoleBadge role={r.user?.role} />
                      {r.user?.team && (
                        <span style={{ fontSize: 11, color: "var(--gray-400)" }}>· {r.user.team}</span>
                      )}
                      {isOwn && (
                        <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>You</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--gray-400)" }}>📅 {r.date}</span>
                      {isToday && (
                        <span className="badge" style={{ background: "#F0FDF4", color: "#166534" }}>Today</span>
                      )}
                      {r.workData?.hoursWorked && (
                        <span style={{ fontSize: 12, color: "var(--gray-400)" }}>⏱ {r.workData.hoursWorked}h</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28 }}>{mood?.emoji}</div>
                    <div style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 600 }}>{mood?.label}</div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: "var(--gray-50)", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                  <p style={{ fontSize: 13, color: "var(--gray-700)", lineHeight: 1.7, margin: 0 }}>{r.summary}</p>
                </div>

                {/* Structured extras from workData */}
                {r.workData && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 8 }}>
                    {r.workData.tasksWorkedOn?.length > 0 && (
                      <div style={{ padding: "8px 10px", background: "var(--primary-light)", borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Tasks</div>
                        {r.workData.tasksWorkedOn.map((t, i) => (
                          <div key={i} style={{ fontSize: 11, color: "var(--gray-700)" }}>· {t}</div>
                        ))}
                      </div>
                    )}
                    {r.workData.blockers && (
                      <div style={{ padding: "8px 10px", background: "#FEF2F2", borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Blockers</div>
                        <div style={{ fontSize: 11, color: "var(--gray-700)" }}>{r.workData.blockers}</div>
                      </div>
                    )}
                    {r.workData.tomorrow && (
                      <div style={{ padding: "8px 10px", background: "#F0FDF4", borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Tomorrow</div>
                        <div style={{ fontSize: 11, color: "var(--gray-700)" }}>{r.workData.tomorrow}</div>
                      </div>
                    )}
                  </div>
                )}

                {isOwn && (
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setShowForm(true)}>
                    ✏️ Edit Report
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ReportModal
        open={showForm}
        onClose={() => setShowForm(false)}
        existing={todayRep}
        onSaved={load}
      />
    </div>
  );
}
