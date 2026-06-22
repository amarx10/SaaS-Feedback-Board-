import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackApi } from '../../api/feedback';
import api from '../../api/axios';
import StatusBadge from '../common/StatusBadge';

export default function FeedbackSidebar({ filters, onFilterChange }) {
  const [categories, setCategories] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || []));
    feedbackApi.getStats().then(r => setStatusCounts(r.data.data || {}));
  }, []);

  const handleCategoryClick = (id) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, category_id: String(id), page: 1 });
    } else {
      navigate(`/?category_id=${id}`);
    }
  };

  const handleStatusClick = (status) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, status, page: 1 });
    } else {
      navigate(`/?status=${status}`);
    }
  };

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
                <li 
                  key={cat.id} 
                  className="category-row"
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{ cursor: 'pointer' }}
                >
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
            <div className="status-row" onClick={() => handleStatusClick('open')} style={{ cursor: 'pointer' }}>
              <StatusBadge status="open" /> <span className="ml-2">{statusCounts.open ?? 0}</span>
            </div>
            <div className="status-row" onClick={() => handleStatusClick('planned')} style={{ cursor: 'pointer' }}>
              <StatusBadge status="planned" /> <span className="ml-2">{statusCounts.planned ?? 0}</span>
            </div>
            <div className="status-row" onClick={() => handleStatusClick('in_progress')} style={{ cursor: 'pointer' }}>
              <StatusBadge status="in_progress" /> <span className="ml-2">{statusCounts.in_progress ?? 0}</span>
            </div>
            <div className="status-row" onClick={() => handleStatusClick('completed')} style={{ cursor: 'pointer' }}>
              <StatusBadge status="completed" /> <span className="ml-2">{statusCounts.completed ?? 0}</span>
            </div>
            <div className="status-row" onClick={() => handleStatusClick('closed')} style={{ cursor: 'pointer' }}>
              <StatusBadge status="closed" /> <span className="ml-2">{statusCounts.closed ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
