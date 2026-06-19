import { useState, useEffect } from 'react';
import { feedbackApi } from '../api/feedback';
import FeedbackCard from '../components/feedback/FeedbackCard';
import FeedbackForm from '../components/feedback/FeedbackForm';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast'; // ✅ FIX: added import

export default function MyFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, [page]);

  const load = async () => {
    setLoading(true);

    try {
      const res = await feedbackApi.myFeedback({ page });
      const d = res.data.data;

      setFeedback(d.items || []);
      setPagination({
        current_page: d.current_page,
        last_page: d.last_page
      });

    } catch {
      // ✅ FIX: no silent failure anymore
      toast.error('Failed to load your feedback. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Live vote update
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
            <h1 className="page-title">My Feedback</h1>
            <p className="page-subtitle">
              Feedback you've submitted to the community.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={15} /> Submit New
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : feedback.length === 0 ? (
        <EmptyState
          title="No feedback submitted yet"
          description="Share your ideas, report bugs, or suggest improvements."
          action={
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} /> Submit Your First Feedback
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

      <FeedbackForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={load}
        existing={null}
      />
    </div>
  );
}