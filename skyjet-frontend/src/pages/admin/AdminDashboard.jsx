import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Users, ThumbsUp, MessageCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats()
      .then(res => setStats(res.data.data))
      .catch(() => {
        toast.error('Failed to load dashboard stats. Please refresh.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const totalFeedback = stats.total_feedback || 0;

  const statusCounts = stats.status_counts || {};
  const categories = stats.category_counts || [];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Overview of your SkyJet Feedback Hub.</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-grid mb-4">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><MessageSquare size={18} /></div>
          <div>
            <div className="stat-label">Total Feedback</div>
            <div className="stat-value">{stats.total_feedback ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><Users size={18} /></div>
          <div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.total_users ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><ThumbsUp size={18} /></div>
          <div>
            <div className="stat-label">Total Votes</div>
            <div className="stat-value">{stats.total_votes ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-orange"><MessageCircle size={18} /></div>
          <div>
            <div className="stat-label">Total Comments</div>
            <div className="stat-value">{stats.total_comments ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--wide-left">
        {/* Left column / Recent Feedback (elongated) */}
        <div>
          <div className="detail-card">
            <div className="widget-header">Recent Feedback</div>
            <div className="widget-body" style={{ paddingBottom: 40 }}>
              {(stats.recent_feedback || []).length === 0 ? (
                <div className="muted">No recent feedback</div>
              ) : (
                <div className="recent-list">
                  {(stats.recent_feedback || []).map(f => (
                    <div key={f.id} className="recent-item" onClick={() => navigate(`/feedback/${f.id}`)}>
                      <div className="recent-title">{f.title}</div>
                      <div className="recent-meta">
                        <div className="recent-meta-left">
                          <StatusBadge status={f.status} />
                          <span className="recent-meta-sep" />
                          <span className="muted">{f.user?.name || '—'}</span>
                        </div>
                        <div className="recent-meta-right">
                          <span className="muted">{formatDistanceToNow(new Date(f.updated_at || f.created_at), { addSuffix: true })}</span>
                          <span className="recent-arrow"><ArrowRight size={13} /></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column / small stacked widgets */}
        <div>
          {/* Categories */}
          <div className="detail-card mb-4">
            <div className="widget-header">Categories</div>
            <div className="widget-body">
              {(categories.length === 0) ? (
                <div className="muted">No categories</div>
              ) : (
                <ul className="category-list">
                  {categories.map(cat => (
                    <li key={cat.id} className="category-row">
                      <div className="category-name"><span className="category-color" style={{ background: cat.color }} /> {cat.name}</div>
                      <div className="category-count">{cat.feedback_count ?? 0}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="detail-card mb-4">
            <div className="widget-header">Status Breakdown</div>
            <div className="widget-body">
              <div className="status-breakdown">
                <div className="status-row"><StatusBadge status="open" /> <span className="ml-2">{statusCounts.open ?? 0}</span></div>
                <div className="status-row"><StatusBadge status="planned" /> <span className="ml-2">{statusCounts.planned ?? 0}</span></div>
                <div className="status-row"><StatusBadge status="in_progress" /> <span className="ml-2">{statusCounts.in_progress ?? 0}</span></div>
                <div className="status-row"><StatusBadge status="completed" /> <span className="ml-2">{statusCounts.completed ?? 0}</span></div>
                <div className="status-row"><StatusBadge status="closed" /> <span className="ml-2">{statusCounts.closed ?? 0}</span></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="detail-card detail-card--actions">
            <div className="widget-header">Quick Actions</div>
            <div className="widget-body">
              <div className="flex flex-col gap-2">
                <button className="btn btn-primary" onClick={() => navigate('/feedback')}>Browse Feedback</button>
                <button className="btn btn-ghost" onClick={() => navigate('/admin/users')}>Manage Users</button>
                <button className="btn btn-ghost" onClick={() => navigate('/admin/categories')}>Manage Categories</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
