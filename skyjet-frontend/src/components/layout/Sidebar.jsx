import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Plus, Bookmark,
  ThumbsUp, Map, User, Settings, BarChart2, Users, Tag,
  ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import FeedbackForm from '../feedback/FeedbackForm';

const logoSrc = '/images/logo.png';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/feedback', label: 'All Feedback', icon: MessageSquare },
  { to: '/my-feedback', label: 'My Feedback', icon: User, auth: true },
  { to: '/voted', label: 'Voted', icon: ThumbsUp, auth: true },
  { to: '/following', label: 'Following', icon: Bookmark, auth: true },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Admin Dashboard', icon: BarChart2, end: true },
  { to: '/admin/feedback', label: 'Manage Feedback', icon: MessageSquare },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
];

export default function Sidebar({ categories = [], statusCounts = {}, open = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const totalFeedback = Object.values(statusCounts).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={logoSrc} alt="SkyJet logo" className="sidebar-logo-image" />
        </div>

        {/* Main Nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Navigation</span>
          {NAV_ITEMS.filter(i => !i.auth || user).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onClose()}
            >
              <item.icon size={16} className="sidebar-nav-icon" />
              {item.label}
            </NavLink>
          ))}

        
          <span className="sidebar-section-label" style={{ marginTop: 8 }}>Categories</span>
          {categories.map(cat => (
            <button
              key={cat.id}
              className="sidebar-nav-item"
              onClick={() => { navigate(`/feedback?category_id=${cat.id}`); onClose(); }}
            >
              <span className="status-dot" style={{ background: cat.color || '#2563EB' }} />
              {cat.name}
              <span className="sidebar-nav-badge">{cat.feedback_count || 0}</span>
            </button>
          ))}

        
          <span className="sidebar-section-label" style={{ marginTop: 8 }}>Status</span>
          {['open','under_review','planned','in_progress','completed'].map(s => (
            <button
              key={s}
              className="sidebar-nav-item"
              onClick={() => { navigate(`/feedback?status=${s}`); onClose(); }}
            >
              <span className={`status-dot status-dot-${s}`} />
              {s === 'in_progress' ? 'In Progress' : s === 'under_review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="sidebar-nav-badge">{statusCounts[s] || 0}</span>
            </button>
          ))}

        
          {user?.is_admin && (
            <>
              <span className="sidebar-section-label" style={{ marginTop: 8 }}>Admin</span>
              {ADMIN_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onClose()}
                >
                  <item.icon size={16} className="sidebar-nav-icon" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

       
        <div className="sidebar-footer">
          {user ? (
            <button className="sidebar-submit-btn sidebar-logout-btn" onClick={handleLogout}>
              <LogOut size={15} />
              Log Out
            </button>
          ) : (
            <button className="sidebar-submit-btn" onClick={() => navigate('/login')}>
              <Plus size={15} />
              Submit Feedback
            </button>
          )}
          {!user && (
            <p className="sidebar-user-hint">We value your feedback<br />Your ideas help us build better products.</p>
          )}
        </div>
      </aside>

      <FeedbackForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {}}
      />
    </>
  );
}
