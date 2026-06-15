import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { feedbackApi } from '../api/feedback';
import api from '../api/axios';
import FeedbackCard from '../components/feedback/FeedbackCard';
import FeedbackFilters from '../components/feedback/FeedbackFilters';
import FeedbackForm from '../components/feedback/FeedbackForm';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Plus, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AllFeedback() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedback, setFeedback] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusCounts, setStatusCounts] = useState({});

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    status: searchParams.get('status') || '',
    sort: searchParams.get('sort') || 'most_voted',
    page: Number(searchParams.get('page')) || 1,
  });

  useEffect(() => {
    const nextFilters = {
      search: searchParams.get('search') || '',
      category_id: searchParams.get('category_id') || '',
      status: searchParams.get('status') || '',
      sort: searchParams.get('sort') || 'most_voted',
      page: Number(searchParams.get('page')) || 1,
    };

    setFilters(prev => (
      prev.search === nextFilters.search &&
      prev.category_id === nextFilters.category_id &&
      prev.status === nextFilters.status &&
      prev.sort === nextFilters.sort &&
      prev.page === nextFilters.page
        ? prev
        : nextFilters
    ));
  }, [searchParams]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || []));
    // Status counts
    Promise.all([
      api.get('/feedback', { params: { status: 'open', per_page: 1 } }),
      api.get('/feedback', { params: { status: 'under_review', per_page: 1 } }),
      api.get('/feedback', { params: { status: 'planned', per_page: 1 } }),
      api.get('/feedback', { params: { status: 'in_progress', per_page: 1 } }),
      api.get('/feedback', { params: { status: 'completed', per_page: 1 } }),
    ]).then(([o, ur, p, ip, c]) => {
      setStatusCounts({
        open: o.data.data?.total || 0,
        under_review: ur.data.data?.total || 0,
        planned: p.data.data?.total || 0,
        in_progress: ip.data.data?.total || 0,
        completed: c.data.data?.total || 0,
      });
    });
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadFeedback();
    }
  }, [filters, authLoading, user]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.status) params.status = filters.status;
      if (filters.sort) params.sort = filters.sort;
      params.page = filters.page;

      const res = await feedbackApi.getAll(params);
      const d = res.data.data;
      setFeedback(d.items || []);
      setPagination({ total: d.total, current_page: d.current_page, last_page: d.last_page });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.category_id) params.category_id = newFilters.category_id;
    if (newFilters.status) params.status = newFilters.status;
    if (newFilters.sort && newFilters.sort !== 'most_voted') params.sort = newFilters.sort;
    setSearchParams(params);
  };

  const totalItems = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="two-col-layout">
      {/* Main */}
      <div className="two-col-main">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">All Feedback</h1>
              <p className="page-subtitle">Browse and vote on feedback from the community.</p>
            </div>
            {user && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={15} />
                Submit
              </button>
            )}
          </div>
        </div>

        <FeedbackFilters
          categories={categories}
          filters={filters}
          onChange={handleFilterChange}
        />

        {loading ? (
          <LoadingSpinner />
        ) : feedback.length === 0 ? (
          <EmptyState
            title="No feedback found"
            description="Try changing the filters or be the first to submit feedback."
            action={user ? <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Submit Feedback</button> : null}
          />
        ) : (
          <>
            <div className="feedback-list">
              {feedback.map(f => (
                <FeedbackCard
                  key={f.id}
                  feedback={f}
                  onVote={() => {}}
                />
              ))}
            </div>
            <Pagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
            />
          </>
        )}
      </div>

      {/* Aside */}
      <div className="two-col-aside">
        {/* Feedback Status Widget */}
        <div className="widget">
          <div className="widget-header">Feedback Status</div>
          <div className="widget-body">
            <div className="status-list">
              {[
                { key: 'open', label: 'Open' },
                { key: 'under_review', label: 'Under Review' },
                { key: 'planned', label: 'Planned' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'completed', label: 'Completed' },
              ].map(({ key, label }) => {
                const count = statusCounts[key] || 0;
                const pct = totalItems ? Math.round((count / totalItems) * 100) : 0;
                return (
                  <div key={key} className="status-list-item">
                    <span className={`status-dot status-dot-${key}`} />
                    <span style={{ fontSize: 12, minWidth: 72 }}>{label}</span>
                    <div className="status-bar-wrap">
                      <div className={`status-bar-fill status-bar-${key}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="status-count">{count}</span>
                  </div>
                );
              })}
            </div>
            <button className="widget-link" onClick={() => handleFilterChange({ ...filters, status: '' })}>
              View all <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {/* Top Categories Widget */}
        <div className="widget">
          <div className="widget-header">Top Categories</div>
          <div className="widget-body">
            <div className="category-chip-list">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="category-chip"
                  onClick={() => handleFilterChange({ ...filters, category_id: String(cat.id), page: 1 })}
                >
                  <span className="category-dot" style={{ background: cat.color || '#2563EB' }} />
                  <span style={{ fontSize: 12 }}>{cat.name}</span>
                  <span className="category-chip-count">{cat.feedback_count || 0}</span>
                </div>
              ))}
            </div>
            <button className="widget-link" onClick={() => handleFilterChange({ ...filters, category_id: '', page: 1 })}>
              View all categories <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {/* Recently Updated */}
        {feedback.length > 0 && (
          <div className="widget">
            <div className="widget-header">Recently Updated</div>
            <div className="widget-body" style={{ padding: '8px 16px' }}>
              <div className="activity-feed">
                {feedback.slice(0, 5).map(f => (
                  <div key={f.id} className="activity-item">
                    <span className={`status-dot status-dot-${f.status}`} style={{ marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <p className="activity-item-title">{f.title}</p>
                      <p className="activity-item-time">
                        {formatDistanceToNow(new Date(f.updated_at || f.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <FeedbackForm open={showForm} onClose={() => setShowForm(false)} onSuccess={loadFeedback} />
    </div>
  );
}