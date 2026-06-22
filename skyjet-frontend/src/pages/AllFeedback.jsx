import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { feedbackApi } from '../api/feedback';
import api from '../api/axios';
import toast from 'react-hot-toast';
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
import FeedbackSidebar from '../components/feedback/FeedbackSidebar';

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
    // Single stats request replaces 5 parallel per-status requests
    feedbackApi.getStats().then(r => setStatusCounts(r.data.data || {}));
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
    setPagination({
      total: d.total,
      current_page: d.current_page,
      last_page: d.last_page,
    });

  } catch (error) {
    toast.error('Failed to load feedback. Please try again.');
    console.error('AllFeedback load error:', error);
  } finally {
    setLoading(false);
  }
};

  // Update vote counts in local state without a full re-fetch
  const handleVote = (updatedFeedback) => {
    setFeedback(prev => prev.map(f =>
      f.id === updatedFeedback.id ? { ...f, ...updatedFeedback } : f
    ));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.category_id) params.category_id = newFilters.category_id;
    if (newFilters.status) params.status = newFilters.status;
    if (newFilters.sort && newFilters.sort !== 'most_voted') params.sort = newFilters.sort;
    if (newFilters.page && newFilters.page > 1) params.page = String(newFilters.page);
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
                Post
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
            description="Try changing the filters or be the first to post feedback."
            action={user ? <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Post Feedback</button> : null}
          />
        ) : (
          <>
            <div className="feedback-list">
              {feedback.map(f => (
                <FeedbackCard
                  key={f.id}
                  feedback={f}
                  onVote={handleVote}
                />
              ))}
            </div>
            <Pagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              onPageChange={(p) => handleFilterChange({ ...filters, page: p })}
            />
          </>
        )}
      </div>

      <FeedbackSidebar filters={filters} onFilterChange={handleFilterChange} />

      <FeedbackForm open={showForm} onClose={() => setShowForm(false)} onSuccess={loadFeedback} />
    </div>
  );
}