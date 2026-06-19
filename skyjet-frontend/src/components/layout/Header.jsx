import { Bell, Search, User, LogOut, BarChart2, Moon, Sun, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationsApi } from '../../api/notifications';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

export default function Header({ onSearch, onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifPage, setNotifPage] = useState(1);
  const [notifLastPage, setNotifLastPage] = useState(1);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const loadNotifications = async (page = 1, append = false) => {
    setNotifLoading(true);
    try {
      const r = await notificationsApi.getAll({ page });
      const notifs = r.data.data || [];
      const total = r.data.total || notifs.length;
      const perPage = 20;

      setNotifications(prev => append ? [...prev, ...notifs] : notifs);
      setUnread(r.data.unread_count ?? 0);
      setNotifPage(page);
      setNotifLastPage(Math.max(1, Math.ceil(total / perPage)));
    } catch {
      // Keep existing notifications on refresh failure
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications(1);
    } else {
      setNotifications([]);
      setUnread(0);
    }
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id) => {
    await notificationsApi.markRead(id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  const handleLoadMoreNotifications = () => {
    if (notifPage < notifLastPage && !notifLoading) {
      loadNotifications(notifPage + 1, true);
    }
  };

  const handleMarkAll = async () => {
    await notificationsApi.markAllRead();
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    setUnread(0);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const { theme, toggle } = useTheme();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/feedback?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="header">
      <button className="header-menu-btn" type="button" onClick={() => onMenu?.()}>
        <Menu size={16} />
      </button>
      <div className="header-search-container">
        <form className="header-search" onSubmit={handleSearch}>
          <Search className="header-search-icon" />
          <input
            placeholder="Search feedback…"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
          />
          <span className="header-search-kbd">⌘ K</span>
        </form>
      </div>

      <div className="header-spacer" />

      <div className="header-actions">
        <button className="header-icon-btn" onClick={toggle} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {user ? (
          <>
           
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="header-icon-btn"
                onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
              >
                <Bell size={16} />
                {unread > 0 && <span className="notif-dot" />}
              </button>
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-panel-header">
                    <span className="notif-panel-title">Notifications</span>
                    {unread > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={handleMarkAll}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-item">
                        <p className="notif-item-msg text-muted">No notifications yet.</p>
                      </div>
                    ) : notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => handleMarkRead(n.id)}
                      >
                        <p className="notif-item-msg">{n.message}</p>
                        <p className="notif-item-time">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                    {notifPage < notifLastPage && (
                      <button
                        className="btn btn-ghost btn-sm w-full"
                        style={{ margin: '8px 12px', width: 'calc(100% - 24px)' }}
                        onClick={handleLoadMoreNotifications}
                        disabled={notifLoading}
                      >
                        {notifLoading ? 'Loading…' : 'Load more'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            
            <div style={{ position: 'relative' }} ref={userRef}>
              <button
                className="header-user-btn"
                onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
              >
                <Avatar user={user} size="sm" />
                <div className="header-user-info">
                  <div className="header-user-name">{user.name}</div>
                  {user.is_admin && <div className="header-user-role">Admin</div>}
                </div>
              </button>
              {userOpen && (
                <div className="user-dropdown">
                  <button className="user-dropdown-item" onClick={() => { navigate('/profile'); setUserOpen(false); }}>
                    <User size={14} /> Profile
                  </button>
                  {user.is_admin && (
                    <button className="user-dropdown-item" onClick={() => { navigate('/admin'); setUserOpen(false); }}>
                      <BarChart2 size={14} /> Admin Panel
                    </button>
                  )}
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>Log In</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Sign Up</button>
          </>
        )}
      </div>
    </header>
  );
}
