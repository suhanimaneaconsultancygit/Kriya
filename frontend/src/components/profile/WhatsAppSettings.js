import { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const maskPhone = (phone) => {
  if (!phone || phone.length < 6) return phone;
  // Keep country code prefix and last 4 digits, mask the middle
  const prefix = phone.slice(0, phone.indexOf("+") === 0 ? 3 : 1);
  const last4   = phone.slice(-4);
  const masked  = "*".repeat(Math.max(0, phone.length - prefix.length - 4));
  return `${prefix}${masked}${last4}`;
};

const validatePhone = (phone) => {
  if (!phone) return "Phone number is required.";
  if (!phone.startsWith("+")) return "Must start with '+' and include country code (e.g. +91XXXXXXXXXX).";
  const digits = phone.slice(1).replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return "Must be 10–15 digits after the '+'.";
  return null;
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const WhatsAppSettings = () => {
  const { user, refreshUser } = useAuth();

  const [optIn,       setOptIn]       = useState(false);
  const [phone,       setPhone]       = useState("");
  const [phoneError,  setPhoneError]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState(null);   // { type: "success"|"error", msg }
  const [saved,       setSaved]       = useState(false);  // true after first successful save

  // Seed from the logged-in user's profile
  useEffect(() => {
    if (user) {
      setOptIn(!!user.whatsappOptIn);
      setPhone(user.phoneNumber || "");
      setSaved(!!(user.phoneNumber && user.whatsappOptIn));
    }
  }, [user]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleToggle = () => {
    const next = !optIn;
    setOptIn(next);
    if (!next) {
      setPhoneError("");
      setSaved(false);
    }
  };

  const handleSave = async () => {
    // Client-side validation
    if (optIn) {
      const err = validatePhone(phone);
      if (err) { setPhoneError(err); return; }
    }
    setPhoneError("");
    setLoading(true);

    try {
      await api.put("/users/whatsapp-settings", {
        phoneNumber:   optIn ? phone : phone, // preserve number even when opting out
        whatsappOptIn: optIn,
      });
      await refreshUser();
      setSaved(optIn);
      setToast({ type: "success", msg: optIn ? "WhatsApp notifications enabled! ✅" : "WhatsApp notifications disabled." });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save. Please try again.";
      setToast({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      {/* ── Toast ── */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "success" ? "var(--success)" : "var(--danger)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.iconWrap}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <div>
          <p style={styles.title}>WhatsApp Notifications</p>
          <p style={styles.subtitle}>Get task alerts directly on WhatsApp</p>
        </div>
      </div>

      {/* ── Toggle row ── */}
      <div style={styles.row}>
        <div>
          <p style={styles.label}>Enable WhatsApp Notifications</p>
          <p style={styles.hint}>
            {optIn ? "You'll receive a message when a task is assigned to you." : "Turn on to receive WhatsApp alerts for new tasks."}
          </p>
        </div>
        <button
          onClick={handleToggle}
          aria-pressed={optIn}
          style={{ ...styles.toggle, background: optIn ? "var(--success)" : "var(--gray-300)" }}
        >
          <span style={{ ...styles.thumb, transform: optIn ? "translateX(22px)" : "translateX(2px)" }} />
        </button>
      </div>

      {/* ── Phone input (visible only when opted in) ── */}
      {optIn && (
        <div style={{ marginTop: 16 }}>
          <label style={styles.label}>
            WhatsApp Phone Number <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <p style={styles.hint}>Include country code — e.g. +91XXXXXXXXXX for India</p>
          <div style={{ position: "relative", marginTop: 8 }}>
            <input
              type="tel"
              placeholder="+91XXXXXXXXXX"
              value={saved ? maskPhone(phone) : phone}
              onChange={(e) => {
                setSaved(false);
                setPhone(e.target.value);
                setPhoneError("");
              }}
              onFocus={() => { if (saved) setSaved(false); }}
              style={{
                ...styles.input,
                borderColor: phoneError ? "var(--danger)" : "var(--gray-200)",
                boxShadow:   phoneError ? "0 0 0 3px rgba(239,68,68,0.12)" : "none",
              }}
            />
            {saved && (
              <span style={styles.savedBadge}>✓ Saved</span>
            )}
          </div>
          {phoneError && <p style={styles.error}>{phoneError}</p>}
        </div>
      )}

      {/* ── Save button ── */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Saving…" : "Save WhatsApp Settings"}
        </button>
      </div>

      {/* ── Info note ── */}
      <p style={styles.note}>
        🔒 Your phone number is stored securely and never shared publicly.
        Only task assignment notifications are sent via WhatsApp.
      </p>
    </div>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  card: {
    background: "#fff",
    border:     "1.5px solid var(--gray-200)",
    borderRadius: "var(--radius-lg)",
    padding:    "24px",
    position:   "relative",
    overflow:   "hidden",
  },
  toast: {
    position:     "absolute",
    top:          12,
    right:        12,
    color:        "#fff",
    fontSize:     13,
    fontWeight:   600,
    padding:      "8px 16px",
    borderRadius: "var(--radius-full)",
    boxShadow:    "var(--shadow-md)",
    zIndex:       10,
    transition:   "opacity 0.3s",
  },
  header: {
    display:       "flex",
    alignItems:    "center",
    gap:           14,
    marginBottom:  20,
    paddingBottom: 20,
    borderBottom:  "1.5px solid var(--gray-100)",
  },
  iconWrap: {
    width:        44,
    height:       44,
    borderRadius: "var(--radius-md)",
    background:   "#25D366",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    flexShrink:   0,
  },
  title: {
    fontSize:   15,
    fontWeight: 700,
    color:      "var(--gray-900)",
  },
  subtitle: {
    fontSize:   12,
    color:      "var(--gray-400)",
    marginTop:  2,
  },
  row: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            16,
  },
  label: {
    fontSize:   13,
    fontWeight: 600,
    color:      "var(--gray-700)",
    marginBottom: 2,
  },
  hint: {
    fontSize: 12,
    color:    "var(--gray-400)",
    marginTop: 2,
  },
  toggle: {
    flexShrink:   0,
    width:        48,
    height:       26,
    borderRadius: 13,
    border:       "none",
    cursor:       "pointer",
    position:     "relative",
    transition:   "background 0.2s",
    padding:      0,
    outline:      "none",
  },
  thumb: {
    position:     "absolute",
    top:          2,
    width:        22,
    height:       22,
    borderRadius: "50%",
    background:   "#fff",
    boxShadow:    "0 1px 4px rgba(0,0,0,0.2)",
    transition:   "transform 0.2s",
    display:      "block",
  },
  input: {
    width:        "100%",
    padding:      "10px 14px",
    fontSize:     14,
    border:       "1.5px solid var(--gray-200)",
    borderRadius: "var(--radius-md)",
    outline:      "none",
    transition:   "border-color 0.2s, box-shadow 0.2s",
    paddingRight: 80,
  },
  savedBadge: {
    position:   "absolute",
    right:      12,
    top:        "50%",
    transform:  "translateY(-50%)",
    fontSize:   11,
    fontWeight: 700,
    color:      "var(--success)",
    background: "rgba(16,185,129,0.1)",
    padding:    "2px 8px",
    borderRadius: "var(--radius-full)",
  },
  error: {
    color:     "var(--danger)",
    fontSize:  12,
    marginTop: 5,
    fontWeight: 500,
  },
  btn: {
    background:   "#25D366",
    color:        "#fff",
    border:       "none",
    borderRadius: "var(--radius-md)",
    padding:      "10px 20px",
    fontSize:     14,
    fontWeight:   700,
    cursor:       "pointer",
    transition:   "opacity 0.2s, transform 0.1s",
  },
  note: {
    fontSize:   11,
    color:      "var(--gray-400)",
    marginTop:  16,
    lineHeight: 1.5,
  },
};

export default WhatsAppSettings;
