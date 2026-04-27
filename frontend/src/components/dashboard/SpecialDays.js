import { useEffect, useState } from "react";
import api from "../../utils/api";

/**
 * SpecialDays
 * Displays today's special days and upcoming days (next 7).
 * Drop this component anywhere in the dashboard without touching existing styles.
 */
export default function SpecialDays() {
  const [todayEvents,    setTodayEvents]    = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [todayRes, upcomingRes] = await Promise.all([
          api.get("/special-days/today"),
          api.get("/special-days/upcoming?days=7"),
        ]);
        setTodayEvents(todayRes.data.events   || []);
        setUpcomingEvents(upcomingRes.data.events || []);
      } catch (e) {
        console.error("Failed to load special days:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return null; // silently skip while loading

  // Helper: "MM-DD" → human readable (e.g. "Apr 26")
  const formatMMDD = (mmdd) => {
    const [mm, dd] = mmdd.split("-");
    return new Date(2000, parseInt(mm) - 1, parseInt(dd))
      .toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const hasToday    = todayEvents.length > 0;
  const hasUpcoming = upcomingEvents.length > 0;

  if (!hasToday && !hasUpcoming) return null;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* ── Today's Special Days ── */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
        🗓️ Today's Special Days
      </h3>

      {hasToday ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: hasUpcoming ? 18 : 0 }}>
          {todayEvents.map((event) => (
            <div
              key={event._id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 14px",
                background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)",
                borderRadius: 10,
                border: "1px solid #C7D2FE",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>🎉</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)" }}>
                  {event.title}
                </div>
                {event.description && (
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2, lineHeight: 1.5 }}>
                    📄 {event.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: hasUpcoming ? 18 : 0 }}>
          No special events today
        </p>
      )}

      {/* ── Upcoming Days ── */}
      {hasUpcoming && (
        <>
          <div style={{ height: 1, background: "var(--gray-100)", marginBottom: 14 }} />
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-600)", marginBottom: 10 }}>
            📅 Coming Up (Next 7 Days)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingEvents.slice(0, 5).map((event) => (
              <div
                key={event._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  background: "var(--gray-50)",
                  borderRadius: 8,
                  border: "1px solid var(--gray-100)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--primary)",
                    background: "#EEF2FF",
                    padding: "2px 7px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                    minWidth: 46,
                    textAlign: "center",
                  }}
                >
                  {formatMMDD(event.date)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-800)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {event.title}
                  </div>
                  {event.description && (
                    <div style={{ fontSize: 11, color: "var(--gray-400)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
