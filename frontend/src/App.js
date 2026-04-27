import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Layout from "./components/common/Layout";
import AuthPage   from "./pages/AuthPage";
import Dashboard  from "./pages/Dashboard";
import Tasks      from "./pages/Tasks";
import Team       from "./pages/Team";
import Reports    from "./pages/Reports";
import Profile    from "./pages/Profile";
import { Spinner } from "./components/common/UI";
import "./index.css";

// ─── PROTECTED ROUTE ─────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner center size={36} />;
  return user ? children : <Navigate to="/login" replace />;
}

// ─── PUBLIC ROUTE (redirect to dashboard if already logged in) ────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner center size={36} />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />

      {/* Protected - wrapped in Layout */}
      <Route path="/" element={<PrivateRoute><Layout><Navigate to="/dashboard" replace /></Layout></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/tasks"     element={<PrivateRoute><Layout><Tasks /></Layout></PrivateRoute>} />
      <Route path="/team"      element={<PrivateRoute><Layout><Team /></Layout></PrivateRoute>} />
      <Route path="/reports"   element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
      <Route path="/profile"   element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            },
            success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
          }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
