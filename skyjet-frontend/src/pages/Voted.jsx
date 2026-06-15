import { useState, useEffect } from 'react';
import { votesApi } from '../api/votes';
import FeedbackCard from '../components/feedback/FeedbackCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';

export default function Voted() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    votesApi.voted()
      .then(res => setFeedback(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Voted</h1>
            <p className="page-subtitle">Feedback you've upvoted.</p>
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
            <button className="btn btn-primary" onClick={() => navigate('/feedback')}>
              Browse Feedback
            </button>
          }
        />
      ) : (
        <div className="feedback-list">
          {feedback.map(f => (
            <FeedbackCard key={f.id} feedback={f} onVote={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}