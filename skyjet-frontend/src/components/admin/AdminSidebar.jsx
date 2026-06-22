import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import StatusBadge from '../common/StatusBadge';

export default function AdminSidebar() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.stats().then(res => setStats(res.data.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="two-col-aside"></div>;

  const categories = stats.category_counts || [];
  const statusCounts = stats.status_counts || {};

  return (
    <div className="two-col-aside">
      {/* Categories */}
      <div className="detail-card mb-4">
        <div className="widget-header">Categories</div>
        <div className="widget-body">
          {categories.length === 0 ? (
            <div className="muted">No categories</div>
          ) : (
            <ul className="category-list">
              {categories.map(cat => (
                <li key={cat.id} className="category-row">
                  <div className="category-name">
                    <span className="category-color" style={{ background: cat.color }} /> {cat.name}
                  </div>
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
            <div className="status-row">
              <StatusBadge status="open" /> <span className="ml-2">{statusCounts.open ?? 0}</span>
            </div>
            <div className="status-row">
              <StatusBadge status="planned" /> <span className="ml-2">{statusCounts.planned ?? 0}</span>
            </div>
            <div className="status-row">
              <StatusBadge status="in_progress" /> <span className="ml-2">{statusCounts.in_progress ?? 0}</span>
            </div>
            <div className="status-row">
              <StatusBadge status="completed" /> <span className="ml-2">{statusCounts.completed ?? 0}</span>
            </div>
            <div className="status-row">
              <StatusBadge status="closed" /> <span className="ml-2">{statusCounts.closed ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="detail-card detail-card--actions">
        <div className="widget-header">Quick Actions</div>
        <div className="widget-body">
          <div className="flex flex-col gap-2">
            <button className="btn btn-primary" onClick={() => navigate('/admin/feedback')}>Manage Feedback</button>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/users')}>Manage Users</button>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/categories')}>Manage Categories</button>
          </div>
        </div>
      </div>
    </div>
  );
}
