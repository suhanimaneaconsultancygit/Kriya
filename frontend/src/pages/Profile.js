import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Avatar, RoleBadge, Field } from "../components/common/UI";
import WhatsAppSettings from "../components/profile/WhatsAppSettings";
import api from "../utils/api";

const Profile = () => {
  const { user, refreshUser } = useAuth();

  const [name,    setName]    = useState(user?.name  || "");
  const [email,   setEmail]   = useState(user?.email || "");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null); // { type, text }

  const handleProfileSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.put("/users/profile", { name, email });
      await refreshUser();
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--gray-900)" }}>Profile & Settings</h1>
        <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>
          Manage your personal details and notification preferences.
        </p>
      </div>

      {/* ── Avatar + Role Card ── */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Avatar user={user} size={56} />
        <div>
          <p style={{ fontWeight: 800, fontSize: 16, color: "var(--gray-900)" }}>{user?.name}</p>
          <p style={{ fontSize: 12, color: "var(--gray-400)", marginBottom: 6 }}>{user?.email}</p>
          <div style={{ display: "flex", gap: 6 }}>
            <RoleBadge role={user?.role} />
            {user?.team && (
              <span className="badge" style={{ background: "var(--gray-100)", color: "var(--gray-600)" }}>
                📂 {user.team}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Info Form ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)", marginBottom: 18 }}>
          Personal Information
        </h2>

        {msg && (
          <div style={{
            marginBottom: 16, padding: "10px 14px", borderRadius: "var(--radius-md)",
            background: msg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: msg.type === "success" ? "var(--success)" : "var(--danger)",
            fontSize: 13, fontWeight: 600,
          }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Full Name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Email Address" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
        </div>

        <div style={{ marginTop: 18 }}>
          <button
            className="btn btn-primary"
            onClick={handleProfileSave}
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>

      {/* ── WhatsApp Notification Settings ── */}
      <WhatsAppSettings />
    </div>
  );
};

export default Profile;
