import { useState, useEffect } from 'react';
import { votesApi } from '../api/votes';
import FeedbackCard from '../components/feedback/FeedbackCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FeedbackSidebar from '../components/feedback/FeedbackSidebar';

export default function Voted() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoted();
  }, [page]);

  const loadVoted = async () => {
    setLoading(true);

    try {
      const res = await votesApi.voted({ page });
      const d = res.data.data || {};

      setFeedback(d.items || []);
      setPagination({
        current_page: d.current_page || 1,
        last_page: d.last_page || 1,
        total: d.total || 0,
      });
    } catch (error) {
      toast.error('Failed to load voted feedback. Please try refreshing.');
      console.error('Voted load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (updatedFeedback) => {
    if (updatedFeedback.has_voted === false) {
      const remaining = feedback.filter(f => f.id !== updatedFeedback.id);
      if (remaining.length === 0 && page > 1) {
        setPage(page - 1);
        return;
      }
      setFeedback(remaining);
      if (remaining.length === 0) {
        loadVoted();
      }
      return;
    }

    setFeedback(prev =>
      prev.map(f =>
        f.id === updatedFeedback.id
          ? { ...f, ...updatedFeedback }
          : f
      )
    );
  };

  return (
    <div className="two-col-layout">
      <div className="two-col-main">
        <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Voted</h1>
            <p className="page-subtitle">
              Feedback you've voted on.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : feedback.length === 0 ? (
        <EmptyState
          title="No votes yet"
          description="Browse feedback and vote on ideas you support."
          action={
            <button
              className="btn btn-primary"
              onClick={() => navigate('/feedback')}
            >
              Browse Feedback
            </button>
          }
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
            onPageChange={setPage}
          />
        </>
      )}
      </div>

      <FeedbackSidebar />
    </div>
  );
}
