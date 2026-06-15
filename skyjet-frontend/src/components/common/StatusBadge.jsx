const STATUS_MAP = {
  open:        { label: 'Open',        cls: 'badge-open' },
  planned:     { label: 'Planned',     cls: 'badge-planned' },
  in_progress: { label: 'In Progress', cls: 'badge-in_progress' },
  under_review: { label: 'Under Review', cls: 'badge-under_review' },
  completed:   { label: 'Completed',   cls: 'badge-completed' },
  closed:      { label: 'Closed',      cls: 'badge-closed' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: '' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}