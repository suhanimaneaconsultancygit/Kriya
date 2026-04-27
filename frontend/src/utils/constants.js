// ─── ROLE HIERARCHY ───────────────────────────────────────────────────────────
export const ROLE_RANK = { admin: 5, sub_admin: 4, team_lead: 3, member: 2, intern: 1 };

export const ROLE_LABELS = {
  admin:     "Admin",
  sub_admin: "Sub Admin",
  team_lead: "Team Lead",
  member:    "Member",
  intern:    "Intern",
};

export const ROLE_COLORS = {
  admin:     { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  sub_admin: { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
  team_lead: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  member:    { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
  intern:    { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
};

// ─── TEAMS ────────────────────────────────────────────────────────────────────
export const TEAMS = ["Web Development", "Marketing", "Designing", "Interns", "SEO", "AI Quality"];

export const TEAM_COLORS = {
  "Web Development": "#6366F1",
  "Marketing":       "#EC4899",
  "Designing":       "#14B8A6",
  "Interns":         "#F59E0B",
  "SEO":             "#8B5CF6",
  "AI Quality":      "#10B981",
};

// ─── TASK STATUS ──────────────────────────────────────────────────────────────
export const STATUS_LABELS = {
  todo:        "To Do",
  in_progress: "In Progress",
  review:      "In Review",
  done:        "Done",
  blocked:     "Blocked",
};

export const STATUS_STYLES = {
  todo:        { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
  in_progress: { bg: "#FFF7ED", text: "#C2410C", dot: "#FB923C" },
  review:      { bg: "#EFF6FF", text: "#1D4ED8", dot: "#60A5FA" },
  done:        { bg: "#F0FDF4", text: "#166534", dot: "#4ADE80" },
  blocked:     { bg: "#FEF2F2", text: "#991B1B", dot: "#F87171" },
};

// ─── PRIORITY ─────────────────────────────────────────────────────────────────
export const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };

export const PRIORITY_STYLES = {
  low:    { bg: "#F0FDF4", text: "#166534", icon: "▲" },
  medium: { bg: "#FEFCE8", text: "#854D0E", icon: "▲▲" },
  high:   { bg: "#FFF7ED", text: "#C2410C", icon: "▲▲▲" },
  urgent: { bg: "#FEF2F2", text: "#991B1B", icon: "🔥" },
};

// ─── MOOD ─────────────────────────────────────────────────────────────────────
export const MOOD_OPTIONS = [
  { key: "great",   emoji: "🔥", label: "Great"   },
  { key: "good",    emoji: "😊", label: "Good"    },
  { key: "neutral", emoji: "😐", label: "Okay"    },
  { key: "tough",   emoji: "😓", label: "Tough"   },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export const getAvatarColor = (name = "") => {
  const colors = ["#6366F1","#EC4899","#14B8A6","#F59E0B","#8B5CF6","#EF4444","#3B82F6","#10B981","#F97316","#06B6D4"];
  return colors[name.charCodeAt(0) % colors.length];
};

export const isOverdue = (dueDate, status) =>
  new Date(dueDate) < new Date() && status !== "done";

export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const today = () => new Date().toISOString().slice(0, 10);
