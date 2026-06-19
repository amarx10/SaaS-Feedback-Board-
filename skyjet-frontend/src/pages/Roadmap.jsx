import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roadmapApi } from '../api/roadmap';
import { feedbackApi } from '../api/feedback';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Badge from '../components/common/Badge';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

const COLUMNS = [
  { key: 'open',        label: 'Open',         dotClass: 'status-dot-open' },
  { key: 'under_review', label: 'Under Review', dotClass: 'status-dot-under_review' },
  { key: 'planned',     label: 'Planned',      dotClass: 'status-dot-planned' },
  { key: 'in_progress', label: 'In Progress',  dotClass: 'status-dot-in_progress' },
  { key: 'completed',   label: 'Completed',    dotClass: 'status-dot-completed' },
];

export default function Roadmap() {
  const navigate = useNavigate();
  const [data, setData] = useState({ columns: {}, counts: {} });
  const [openItems, setOpenItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  setLoading(true);

  try {
    const [roadmapRes, openRes] = await Promise.all([
      roadmapApi.get(),
      feedbackApi.getAll({ status: 'open', sort: 'most_voted', per_page: 20 }),
    ]);

    const roadmapData = roadmapRes.data.data;

    setData(roadmapData);
    setOpenItems(openRes.data.data.items || []);

  } catch (error) {
    toast.error('Failed to load roadmap. Please refresh.');
    console.error('Roadmap load error:', error);
  } finally {
    setLoading(false);
  }
};

  if (loading) return <LoadingSpinner message="Loading roadmap…" />;

  const getItems = (key) => {
    if (key === 'open') return openItems;
    return data.columns?.[key] || [];
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Roadmap</h1>
            <p className="page-subtitle">Track what we're working on and what's coming next.</p>
          </div>
        </div>
      </div>

      <div className="roadmap-columns">
        {COLUMNS.map(col => {
          const items = getItems(col.key);
          return (
            <div key={col.key} className="roadmap-col">
              <div className="roadmap-col-header">
                <span className={`roadmap-col-dot ${col.dotClass}`} />
                <span className="roadmap-col-title">{col.label}</span>
                <span className="roadmap-col-count">{items.length}</span>
              </div>
              <div className="roadmap-col-body">
                {items.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-light)' }}>
                    No items
                  </div>
                ) : items.map(item => (
                  <div
                    key={item.id}
                    className="roadmap-item"
                    onClick={() => navigate(`/feedback/${item.id}`)}
                  >
                    <p className="roadmap-item-title">{item.title}</p>
                    {item.category && (
                      <div style={{ marginBottom: 6 }}>
                        <Badge label={item.category.name} color={item.category.color} />
                      </div>
                    )}
                    <div className="roadmap-item-meta">
                      <span className="roadmap-item-votes">
                        <ThumbsUp size={11} />
                        {item.upvotes_count ?? 0}
                      </span>
                      <span className="roadmap-item-votes roadmap-item-votes-down">
                        <ThumbsDown size={11} />
                        {item.downvotes_count ?? 0}
                      </span>
                      <span className="roadmap-item-votes">
                        <MessageSquare size={11} />
                        {item.comments_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}