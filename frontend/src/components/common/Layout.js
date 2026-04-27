import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Avatar, RoleBadge } from "./UI";
import NotificationBell from "../notifications/NotificationBell";

const NAV_ITEMS = [
  { path: "/dashboard", icon: "⊞",  label: "Dashboard" },
  { path: "/tasks",     icon: "✓",  label: "Tasks"      },
  { path: "/team",      icon: "👥", label: "Team"       },
  { path: "/reports",   icon: "📋", label: "Reports"    },
  { path: "/profile",   icon: "⚙️", label: "Profile"    },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 64 : 240, flexShrink: 0,
        background: "var(--sidebar-bg)", display: "flex", flexDirection: "column",
        height: "100vh", transition: "width 0.25s ease", overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
          {!collapsed && <div><div style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.4 }}>TaskFlow</div><div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Workspace</div></div>}
        </div>

        {/* User */}
        {!collapsed && user && (
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar user={user} size={34} />
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <RoleBadge role={user.role} />
              </div>
            </div>
            {user.team && <div style={{ marginTop: 7, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>📂 {user.team}</div>}
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
              borderRadius: 9, marginBottom: 2, textDecoration: "none",
              background: isActive ? "rgba(99,102,241,0.18)" : "transparent",
              color:      isActive ? "#A5B4FC" : "rgba(255,255,255,0.45)",
              fontWeight: isActive ? 700 : 500, fontSize: 13, transition: "all 0.15s",
            })}>
              <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: "center" }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setCollapsed((c) => !c)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, width: "100%", border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", marginBottom: 4 }}>
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{collapsed ? "▶" : "◀"}</span>
            {!collapsed && "Collapse"}
          </button>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, width: "100%", border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#F87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>⏻</span>
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: "var(--topbar-h)", background: "#fff", borderBottom: "1.5px solid var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)" }}>
              {NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.label || "TaskFlow"}
            </div>
            <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <NotificationBell />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)" }}>{user?.name}</div>
              <RoleBadge role={user?.role} />
            </div>
            <Avatar user={user} size={34} />
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
