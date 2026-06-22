import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackApi } from '../api/feedback';
import api from '../api/axios';
import toast from 'react-hot-toast';
import DashboardFeedbackCard from '../components/feedback/DashboardFeedbackCard';
import FeedbackForm from '../components/feedback/FeedbackForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import AnimatedWaves from '../components/common/AnimatedWaves';
import { useAuth } from '../context/AuthContext';
import { Plus, TrendingUp, Sparkles, ExternalLink, ArrowRight, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardFeedback, setDashboardFeedback] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const lightImg = '/images/panelbg.png';
  const darkImg = '/images/paneldarkbg.png';

  useEffect(() => {
    if (!authLoading) {
      loadDashboard();
    }
  }, [authLoading, user]);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const [feedRes, trendRes, catRes] = await Promise.all([
        feedbackApi.getAll({ sort: 'most_voted', per_page: 30 }),
        feedbackApi.getAll({ sort: 'trending', per_page: 3 }),
        api.get('/categories'),
      ]);

      setDashboardFeedback(feedRes.data.data.items || []);
      setTrending(trendRes.data.data.items || []);
      setCategories(catRes.data.data || []);

      const statsRes = await feedbackApi.getStats();
      setStatusCounts(statsRes.data.data);

    } catch (error) {
      toast.error('Failed to load dashboard. Please try refreshing.');

      if (import.meta.env.DEV) {
        console.error('Dashboard loading failed:', error);
      }

    } finally {
      setLoading(false);
    }
  };

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const feedbackByCategory = categories.reduce((map, category) => {
    map[category.id] = [];
    return map;
  }, {});

  dashboardFeedback.forEach((item) => {
    if (item.category?.id && feedbackByCategory[item.category.id]) {
      feedbackByCategory[item.category.id].push(item);
    }
  });

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <div>
      {/* Banner */}
      <div
        className="dashboard-banner-card"
        style={{
          '--banner-bg': `url(${lightImg})`,
          '--banner-bg-dark': `url(${darkImg})`,
        }}
      >
        <AnimatedWaves darkMode={document.documentElement.dataset.theme === 'dark'} />
        <div className="banner-card-copy">
          <h1 className="banner-card-title">SkyJet Feedback Hub</h1>
          <p className="banner-card-text">
            Share your ideas, report issues, and help us build better products.
          </p>
        </div>
      </div>

      <div className="dashboard-top-panels">
        <div className="dashboard-top-panel">
          <div className="dashboard-panel-header">
            <div className="flex items-center gap-2">
              <Sparkles size={16} color="var(--warning)" />
              <span className="dashboard-panel-title">Feedback Overview</span>
            </div>
          </div>
          <CategoryDonutChart categories={categories} compact />
        </div>

        <div className="dashboard-top-panel dashboard-status-panel">
          <div className="dashboard-panel-header">
            <span className="dashboard-panel-title">Feedback Status</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/roadmap')}>
              View roadmap <ExternalLink size={12} />
            </button>
          </div>

          <div className="widget-body dashboard-panel-body">
            <div className="status-list">
              {[
                { key: 'open', label: 'Open' },
                { key: 'under_review', label: 'Under Review' },
                { key: 'planned', label: 'Planned' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'completed', label: 'Completed' },
              ].map(({ key, label }) => {
                const count = statusCounts[key] || 0;
                const pct = total ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={key} className="status-list-item" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flexShrink: 0, width: '100px' }}>
                      <span className={`status-dot status-dot-${key}`} style={{ marginRight: '6px' }} />
                      <span className="status-label" style={{ fontSize: '13px', fontWeight: '600' }}>{label}</span>
                    </div>
                    <div className="status-bar-wrap" style={{ flex: 1, height: '6px', background: 'var(--surface-2)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div
                        className={`status-bar-fill status-bar-${key}`}
                        style={{ width: `${pct}%`, height: '100%', borderRadius: '10px' }}
                      />
                    </div>
                    <span className="status-count" style={{ fontWeight: '700', fontSize: '14px', width: '24px', textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {trending.length > 0 && (
          <div className="dashboard-top-panel dashboard-trending-panel">
            <div className="dashboard-panel-header">
              <span className="dashboard-panel-title">
                <TrendingUp size={13} /> Trending
              </span>
            </div>

            <div className="widget-body dashboard-panel-body dashboard-trending-body">
              <div className="activity-feed">
                {trending.map((f) => (
                  <div
                    key={f.id}
                    className="activity-item"
                    onClick={() => navigate(`/feedback/${f.id}`)}
                    style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', marginBottom: '8px', cursor: 'pointer', display: 'flex', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: '8px', padding: '6px 10px', flexShrink: 0, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>{f.votes_count}</span>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: '700' }}>Votes</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p className="activity-item-title" style={{ fontWeight: '700', fontSize: '14px', margin: 0 }}>{f.title}</p>
                      <p className="activity-item-time" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                        {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-category-columns">
        {categories.map((category) => (
          <div key={category.id} className="category-column-card">
            <div className="category-column-header">
              <div>
                <div className="category-column-title">{category.name}</div>
                <div className="category-column-subtitle">
                  {category.feedback_count || 0} items
                </div>
              </div>

              <button
                className="category-view-all"
                onClick={() =>
                  navigate(`/feedback?category_id=${category.id}`)
                }
              >
                View all
              </button>
            </div>

            <div className="category-column-list">
              {feedbackByCategory[category.id]?.length > 0 ? (
                feedbackByCategory[category.id]
                  .slice(0, 3)
                  .map((item) => (
                    <DashboardFeedbackCard
                      key={item.id}
                      feedback={item}
                      onClick={() => navigate(`/feedback/${item.id}`)}
                    />
                  ))
              ) : (
                <div className="empty-category-message">
                  No feedback yet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <FeedbackForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadDashboard}
      />
    </div>
  );
}