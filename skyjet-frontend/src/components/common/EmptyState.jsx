import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here', description = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={22} />
      </div>
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}