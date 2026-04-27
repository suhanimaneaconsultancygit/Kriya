import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { TEAMS, ROLE_LABELS } from "../utils/constants";

const REGISTER_ROLES = ["sub_admin", "team_lead", "member", "intern"];

export default function AuthPage() {
  const [mode,    setMode]    = useState("login");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "member", team: "Web Development",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!form.name.trim())                      return setError("Please enter your full name.");
      if (form.password !== form.confirmPassword) return setError("Passwords don't match.");
      if (form.password.length < 6)               return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email.trim().toLowerCase(), form.password);
      } else {
        const needsTeam = !["admin", "sub_admin"].includes(form.role);
        await register({
          name:     form.name,
          email:    form.email.trim().toLowerCase(),
          password: form.password,
          role:     form.role,
          team:     needsTeam ? form.team : undefined,
        });
      }
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Something went wrong.";
      setError(msg);
      console.error("Auth error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const needsTeam = !["admin", "sub_admin"].includes(form.role);

  const roleHints = {
    sub_admin: "🔑 Can assign to all teams, view all reports (except Admin)",
    team_lead: "🔑 Can assign to team members & interns in their team",
    member:    "🔑 Can assign tasks to interns + self-assign tasks",
    intern:    "🔑 Can create & update own tasks only",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      {/* Animated blobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[
          { w: 500, h: 500, x: "-10%", y: "-15%", color: "rgba(99,102,241,0.15)" },
          { w: 400, h: 400, x: "60%",  y: "50%",  color: "rgba(139,92,246,0.12)" },
          { w: 300, h: 300, x: "20%",  y: "70%",  color: "rgba(236,72,153,0.08)" },
        ].map((b, i) => (
          <div key={i} style={{
            position: "absolute", width: b.w, height: b.h, borderRadius: "50%",
            background: b.color, left: b.x, top: b.y, filter: "blur(60px)",
            animation: `floatBlob${i} ${5 + i}s ease-in-out infinite alternate`,
          }} />
        ))}
        <style>{`
          @keyframes floatBlob0{from{transform:translateY(0) scale(1)}to{transform:translateY(-30px) scale(1.05)}}
          @keyframes floatBlob1{from{transform:translateY(0) rotate(0deg)}to{transform:translateY(-20px) rotate(5deg)}}
          @keyframes floatBlob2{from{transform:translateY(0)}to{transform:translateY(-25px)}}
        `}</style>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.97)", borderRadius: 20, padding: "36px 32px",
        width: "100%", maxWidth: 460, boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 16, marginBottom: 12,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            boxShadow: "0 8px 24px rgba(99,102,241,0.45)", fontSize: 26,
          }}>⚡</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111", letterSpacing: -0.5, margin: 0 }}>TaskFlow</h1>
          <p style={{ color: "#9CA3AF", fontSize: 13, margin: "4px 0 0" }}>Team task management platform</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 3, marginBottom: 24 }}>
          {[["login", "Sign In"], ["register", "Create Account"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, padding: "8px 0", border: "none", borderRadius: 8, fontSize: 13,
              fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#6366F1" : "#9CA3AF",
              boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>{label}</button>
          ))}
        </div>

        {/* Error box */}
        {error && (
          <div style={{
            background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA",
            borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600,
            marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="field">
              <label>Full Name <span style={{ color: "#EF4444" }}>*</span></label>
              <input placeholder="e.g. Riya Mehta" value={form.name} onChange={set("name")} required />
            </div>
          )}

          <div className="field">
            <label>Email Address <span style={{ color: "#EF4444" }}>*</span></label>
            <input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label>Password <span style={{ color: "#EF4444" }}>*</span></label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              autoComplete="current-password"
              required
            />
          </div>

          {mode === "register" && (
            <>
              <div className="field">
                <label>Confirm Password <span style={{ color: "#EF4444" }}>*</span></label>
                <input
                  type="password" placeholder="••••••••"
                  value={form.confirmPassword} onChange={set("confirmPassword")} required
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Role / Position <span style={{ color: "#EF4444" }}>*</span></label>
                  <select value={form.role} onChange={set("role")}>
                    {REGISTER_ROLES.map((k) => (
                      <option key={k} value={k}>{ROLE_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                {needsTeam && (
                  <div className="field">
                    <label>Team <span style={{ color: "#EF4444" }}>*</span></label>
                    <select value={form.team} onChange={set("team")}>
                      {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {roleHints[form.role] && (
                <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#6B7280", marginBottom: 16, lineHeight: 1.6 }}>
                  {roleHints[form.role]}
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", marginTop: 4,
              background: loading ? "#A5B4FC" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading
              ? <><span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Signing in...</>
              : mode === "login" ? "Sign In" : "Create Account"
            }
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </form>

        {/* Subtle hint for admin */}
        {mode === "login" && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
            Admin? Use your registered admin email and password.
          </p>
        )}
      </div>
    </div>
  );
}
