import { MessageSquare, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardFeedbackCard({ feedback, onClick }) {
  return (
    <div className="kanban-card" onClick={onClick}>
      {/* Top Row: Votes & Comments */}
      <div className="kanban-card-meta-row">
        <div className="kanban-card-metric">
          <ArrowUp size={13} />
          <span>{feedback.upvotes_count || 0}</span>
        </div>
        <div className="kanban-card-metric">
          <ArrowDown size={13} />
          <span>{feedback.downvotes_count || 0}</span>
        </div>
        <div className="kanban-card-metric">
          <MessageSquare size={13} />
          <span>{feedback.comments_count || 0}</span>
        </div>
      </div>

      {/* Middle: Title & Description */}
      <div className="kanban-card-content">
        <h4 className="kanban-card-title">{feedback.title}</h4>
        <p className="kanban-card-description">{feedback.description}</p>
      </div>

      {/* Bottom Row: Status, User, Time */}
      <div className="kanban-card-footer">
        <div className="kanban-card-status">
          <StatusBadge status={feedback.status} />
        </div>
        <div className="kanban-card-user-info">
          {feedback.user?.avatar_url ? (
            <img src={feedback.user.avatar_url} alt={feedback.user.name} className="kanban-card-avatar" />
          ) : (
            <span className="kanban-card-avatar-placeholder">{feedback.user?.initials || 'U'}</span>
          )}
          <div className="kanban-card-user-details">
            <span className="kanban-card-username">{feedback.user?.name || 'Unknown'}</span>
            <span className="kanban-card-timestamp">
              <Clock size={11} />
              {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
