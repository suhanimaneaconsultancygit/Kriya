import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const shownIdsRef = useRef(new Set());
  const pollingRef = useRef(null);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission === 'default') {
      try { await window.Notification.requestPermission(); } catch {}
    }
  }, []);

  const showVisualNotification = useCallback((notification) => {
    const actorName = notification?.actor?.name || notification?.meta?.assignedByName || 'TaskFlow';
    const text = notification?.message || 'You have a new task update.';

    toast.custom((t) => (
      <div
        onClick={() => {
          window.location.href = '/tasks';
          toast.dismiss(t.id);
        }}
        style={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderLeft: '4px solid #6366F1',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
          padding: '14px 16px',
          minWidth: 320,
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: '#6366F1', marginBottom: 4 }}>New Task Notification</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{notification.title}</div>
        <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 6 }}>{text}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Assigned by {actorName} · Click to open Tasks</div>
      </div>
    ), { duration: 6000 });

    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      const browserNote = new window.Notification('Task Assigned', {
        body: `${notification.title} — ${text}`,
      });
      browserNote.onclick = () => {
        window.focus();
        window.location.href = '/tasks';
      };
    }
  }, []);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications?limit=20');
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadCount(data.unreadCount || 0);

      if (!silent) {
        list.forEach((item) => shownIdsRef.current.add(item._id));
        return;
      }

      list
        .filter((item) => !item.isRead && !shownIdsRef.current.has(item._id))
        .reverse()
        .forEach((item) => {
          shownIdsRef.current.add(item._id);
          showVisualNotification(item);
        });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, [user, showVisualNotification]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      shownIdsRef.current = new Set();
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    requestBrowserPermission();
    fetchNotifications(false);
    pollingRef.current = setInterval(() => fetchNotifications(true), 15000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, fetchNotifications, requestBrowserPermission]);

  const markOneAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  }, []);

  const value = useMemo(() => ({ notifications, unreadCount, refreshNotifications: fetchNotifications, markOneAsRead, markAllAsRead }), [notifications, unreadCount, fetchNotifications, markOneAsRead, markAllAsRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
