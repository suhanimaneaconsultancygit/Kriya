import { getInitials, getAvatarColor, STATUS_STYLES, STATUS_LABELS, PRIORITY_STYLES, PRIORITY_LABELS, ROLE_LABELS, ROLE_COLORS } from "../../utils/constants";

// ─── AVATAR ───────────────────────────────────────────────────────────────────
export const Avatar = ({ user, size = 36, style }) => {
  const bg    = getAvatarColor(user?.name || "");
  const label = getInitials(user?.name || "?");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.35, fontWeight: 700,
      flexShrink: 0, letterSpacing: 0.5, ...style
    }}>
      {label}
    </div>
  );
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.todo;
  return (
    <span className="badge" style={{ background: s.bg, color: s.text }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
};

// ─── PRIORITY BADGE ───────────────────────────────────────────────────────────
export const PriorityBadge = ({ priority }) => {
  const p = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span className="badge" style={{ background: p.bg, color: p.text }}>
      {p.icon} {PRIORITY_LABELS[priority] || priority}
    </span>
  );
};

// ─── ROLE BADGE ───────────────────────────────────────────────────────────────
export const RoleBadge = ({ role }) => {
  const c = ROLE_COLORS[role] || ROLE_COLORS.intern;
  return (
    <span className="badge" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, width = 560 }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--gray-900)" }}>{title}</h2>
          <button className="btn btn-icon" onClick={onClose} style={{ fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20, center }) => (
  <div style={center ? { display: "flex", justifyContent: "center", alignItems: "center", height: "100%", padding: 40 } : {}}>
    <div className="loader" style={{ width: size, height: size }} />
  </div>
);

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
export const Field = ({ label, required, error, children, style }) => (
  <div className="field" style={style}>
    {label && (
      <label>{label}{required && <span className="req">*</span>}</label>
    )}
    {children}
    {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
  </div>
);

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, color = "#6366F1", subtitle, trend }) => (
  <div className="card" style={{ flex: 1, minWidth: 140 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 800, color: "var(--gray-900)", lineHeight: 1 }}>{value}</p>
        {subtitle && <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>{subtitle}</p>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
    </div>
    {trend !== undefined && (
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--gray-100)", fontSize: 12, color: trend >= 0 ? "var(--success)" : "var(--danger)" }}>
        {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% from last week
      </div>
    )}
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const Empty = ({ icon = "📋", title = "Nothing here", subtitle, action }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    {subtitle && <p>{subtitle}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

// ─── ALERT ────────────────────────────────────────────────────────────────────
export const Alert = ({ type = "error", message }) => {
  if (!message) return null;
  const styles = {
    error:   { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    success: { bg: "#F0FDF4", color: "#166534", border: "#86EFAC" },
    info:    { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
    warning: { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
  };
  const s = styles[type] || styles.error;
  return (
    <div style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.border}`, borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
      {message}
    </div>
  );
};

// ─── TAG ──────────────────────────────────────────────────────────────────────
export const Tag = ({ label }) => (
  <span style={{ padding: "2px 8px", background: "var(--primary-light)", color: "var(--primary)", borderRadius: "var(--radius-full)", fontSize: 10, fontWeight: 700 }}>
    #{label}
  </span>
);

// ─── SELECT FIELD ─────────────────────────────────────────────────────────────
export const SelectField = ({ label, required, value, onChange, options, placeholder, disabled }) => (
  <Field label={label} required={required}>
    <select value={value} onChange={onChange} disabled={disabled}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  </Field>
);
