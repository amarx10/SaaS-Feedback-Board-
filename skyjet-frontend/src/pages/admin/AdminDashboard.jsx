import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Users, ThumbsUp, MessageCircle, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats()
      .then(res => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const STATUS_LABELS = {
    open: 'Open', planned: 'Planned', in_progress: 'In Progress',
    completed: 'Completed', closed: 'Closed',
  };

  const totalFeedback = stats.total_feedback || 0;

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
            <div className="stat-value">{stats.total_feedback}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><Users size={18} /></div>
          <div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.total_users}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><ThumbsUp size={18} /></div>
          <div>
            <div className="stat-label">Total Votes</div>
            <div className="stat-value">{stats.total_votes}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange"><MessageCircle size={18} /></div>
          <div>
            <div className="stat-label">Total Comments</div>
            <div className="stat-value">{stats.total_comments}</div>
          </div>
        </div>
      </div>

      <div className="admin-layout">
        {/* Recent Feedback */}
        <div className="table-container">
          <div className="card-header">
            <span className="card-title">Recently Updated Feedback</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/feedback')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recent_feedback || []).map(f => (
                <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/feedback/${f.id}`)}>
                  <td>
                    <span className="font-medium" style={{ fontSize: 13 }}>{f.title}</span>
                  </td>
                  <td><StatusBadge status={f.status} /></td>
                  <td className="text-muted text-sm">
                    {formatDistanceToNow(new Date(f.updated_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status breakdown */}
          <div className="widget">
            <div className="widget-header">Status Breakdown</div>
            <div className="widget-body">
              <div className="status-list">
                {Object.entries(stats.status_counts || {}).map(([status, count]) => {
                  const pct = totalFeedback ? Math.round((count / totalFeedback) * 100) : 0;
                  return (
                    <div key={status} className="status-list-item">
                      <span className={`status-dot status-dot-${status}`} />
                      <span style={{ fontSize: 12, minWidth: 80 }}>{STATUS_LABELS[status] || status}</span>
                      <div className="status-bar-wrap">
                        <div className={`status-bar-fill status-bar-${status}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="status-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="widget">
            <div className="widget-header">Top Categories</div>
            <div className="widget-body">
              <div className="category-chip-list">
                {(stats.category_counts || []).map(cat => (
                  <div key={cat.id} className="category-chip">
                    <span className="category-dot" style={{ background: cat.color || '#2563EB' }} />
                    <span style={{ fontSize: 12 }}>{cat.name}</span>
                    <span className="category-chip-count">{cat.feedback_count || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="widget">
            <div className="widget-header">Quick Actions</div>
            <div className="widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/admin/feedback')}>
                Manage Feedback
              </button>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/admin/users')}>
                Manage Users
              </button>
              <button className="btn btn-secondary w-full" onClick={() => navigate('/admin/categories')}>
                Manage Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}