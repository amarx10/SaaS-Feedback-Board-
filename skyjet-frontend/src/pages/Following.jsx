import { useState, useEffect } from 'react';
import api from '../api/axios';
import FeedbackCard from '../components/feedback/FeedbackCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Following() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, [page]);

  const load = async () => {
    setLoading(true);

    try {
      const res = await api.get('/following', { params: { page } });
      const d = res.data.data;

      setFeedback(d.items || []);
      setPagination({
        current_page: d.current_page,
        last_page: d.last_page
      });

    } catch (error) {
      toast.error('Failed to load. Please try refreshing.');
      console.error('Following load error:', error);
    } finally {
      setLoading(false);
    }
  };
const handleVote = (updatedFeedback) => {
  setFeedback(prev =>
    prev.map(f =>
      f.id === updatedFeedback.id
        ? { ...f, ...updatedFeedback }
        : f
    )
  );
};

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Following</h1>
            <p className="page-subtitle">
              Feedback you're tracking for updates.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : feedback.length === 0 ? (
        <EmptyState
          title="Not following anything yet"
          description="Follow feedback items to get notified when they're updated."
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
  );
}