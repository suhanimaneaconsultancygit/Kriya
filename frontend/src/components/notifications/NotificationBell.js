import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { formatDate } from '../../utils/constants';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markOneAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpenTask = async (note) => {
    if (!note.isRead) await markOneAsRead(note._id);
    setOpen(false);
    navigate('/tasks');
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost"
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'relative', width: 42, height: 42, padding: 0, borderRadius: 999 }}
        title="Notifications"
      >
        <span style={{ fontSize: 18 }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18,
            borderRadius: 999, background: '#EF4444', color: '#fff', fontSize: 10,
            fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 50, right: 0, width: 360, maxHeight: 440, overflowY: 'auto',
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14,
          boxShadow: '0 20px 50px rgba(15,23,42,0.16)', zIndex: 1000
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Notifications</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{unreadCount} unread</div>
            </div>
            <button className="btn btn-ghost" onClick={markAllAsRead} style={{ fontSize: 12, padding: '6px 10px' }}>Mark all read</button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No notifications yet</div>
          ) : notifications.map((note) => (
            <button
              key={note._id}
              onClick={() => handleOpenTask(note)}
              style={{
                width: '100%', textAlign: 'left', border: 'none', background: note.isRead ? '#fff' : '#F8FAFC',
                padding: '14px 16px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 18 }}>{note.type === 'task_reassigned' ? '🔄' : '📌'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</div>
                    {!note.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 4 }}>{note.message}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{formatDate(note.createdAt)}{note.actor?.name ? ` · by ${note.actor.name}` : ''}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
