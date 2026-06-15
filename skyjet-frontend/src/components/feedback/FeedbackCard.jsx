import { useNavigate } from 'react-router-dom';
import { MessageSquare, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VoteButton from './VoteButton';
import StatusBadge from '../common/StatusBadge';
import Badge from '../common/Badge';

export default function FeedbackCard({ feedback, onVote }) {
  const navigate = useNavigate();

  const handleClick = () => navigate(`/feedback/${feedback.id}`);

  return (
    <div className={`feedback-card ${feedback.is_pinned ? 'pinned' : ''}`}>
      <VoteButton
        feedbackId={feedback.id}
        upvotes={feedback.upvotes_count}
        downvotes={feedback.downvotes_count}
        voteType={feedback.user_vote_type}
        onVote={onVote}
      />
      <div className="feedback-body" onClick={handleClick}>
        <div className="feedback-card-header">
          <div className="feedback-title-row">
            {feedback.is_pinned && <Pin size={12} className="feedback-pin-icon" />}
            <span className="feedback-title">{feedback.title}</span>
          </div>
        </div>
        <p className="feedback-desc">{feedback.description}</p>
        <div className="feedback-meta">
          {feedback.category && (
            <Badge
              label={feedback.category.name}
              color={feedback.category.color || '#2563EB'}
            />
          )}
          <StatusBadge status={feedback.status} />
          <span className="feedback-meta-item">
            <MessageSquare size={12} />
            {feedback.comments_count}
          </span>
          <span className="feedback-meta-item">
            <span className="feedback-user-avatar-sm">
              {feedback.user?.avatar_url
                ? <img src={feedback.user.avatar_url} alt={feedback.user.name} />
                : feedback.user?.initials || '?'
              }
            </span>
            {feedback.user?.name}
          </span>
          <span className="feedback-meta-item" style={{ marginLeft: 'auto' }}>
            {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
