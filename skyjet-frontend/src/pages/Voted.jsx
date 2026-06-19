import { useState, useEffect } from 'react';
import { votesApi } from '../api/votes';
import FeedbackCard from '../components/feedback/FeedbackCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Voted() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoted();
  }, []);

  const loadVoted = async () => {
    setLoading(true);

    try {
      const res = await votesApi.voted();
      const items = res.data.data?.items || [];
      setFeedback(items);
    } catch (error) {
      toast.error('Failed to load voted feedback. Please try refreshing.');
      console.error('Voted load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: remove item when vote is retracted; this page only shows items the user has voted on.
  const handleVote = (updatedFeedback) => {
    setFeedback(prev => {
      if (updatedFeedback.has_voted === false) {
        return prev.filter(f => f.id !== updatedFeedback.id);
      }
      return prev.map(f =>
        f.id === updatedFeedback.id
          ? { ...f, ...updatedFeedback }
          : f
      );
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Voted</h1>
            <p className="page-subtitle">
              Feedback you've upvoted.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : feedback.length === 0 ? (
        <EmptyState
          title="No votes yet"
          description="Browse feedback and upvote ideas you support."
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
        <div className="feedback-list">
          {feedback.map(f => (
            <FeedbackCard
              key={f.id}
              feedback={f}
              onVote={handleVote}   // ✅ FIXED
            />
          ))}
        </div>
      )}
    </div>
  );
}