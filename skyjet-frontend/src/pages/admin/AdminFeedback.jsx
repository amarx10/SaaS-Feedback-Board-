import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import StatusBadge from '../../components/common/StatusBadge';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Search, Trash2, Pin, PinOff, Edit2 } from 'lucide-react';

const STATUS_OPTIONS = ['open','under_review','planned','in_progress','completed','closed'];

const formatStatusLabel = (status) =>
  status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function AdminFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pinnedFilter, setPinnedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', admin_response: '' });
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    load();
  }, [page, search, statusFilter, pinnedFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (pinnedFilter) params.pinned = 1;

      const res = await adminApi.allFeedback(params);
      const d = res.data.data;

      setFeedback(d.items || []);
      setPagination({
        current_page: d.current_page,
        last_page: d.last_page,
        total: d.total,
      });
    } catch {
      toast.error('Failed to load feedback. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (f) => {
    setStatusModal(f);
    setStatusForm({ status: f.status, admin_response: f.admin_response || '' });
  };

  const handleUpdateStatus = async () => {
    if (!statusModal) return;
    setActionLoading(true);

    try {
      await adminApi.updateStatus(statusModal.id, statusForm);
      toast.success('Status updated successfully.');
      setStatusModal(null);
      load();
    } catch {
      toast.error('Failed to update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await adminApi.togglePin(id);
      toast.success('Pin updated successfully.');
      load();
    } catch {
      toast.error('Failed to toggle pin. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setActionLoading(true);

    try {
      await adminApi.deleteFeedback(deleteModal);
      toast.success('Feedback deleted successfully.');
      setDeleteModal(null);
      load();
    } catch {
      toast.error('Failed to delete feedback. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Manage Feedback</h1>
            <p className="page-subtitle">{pagination.total} total items</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar mb-3">
        <div className="filter-search-wrap">
          <Search className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search feedback…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{formatStatusLabel(s)}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={pinnedFilter}
          onChange={e => { setPinnedFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Feedback</option>
          <option value="pinned">Pinned only</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Votes</th>
                <th>Comments</th>
                <th>Submitted by</th>
                <th>Date</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {feedback.map(f => (
                <tr key={f.id}>
                  <td>
                    <span
                      className="font-medium"
                      style={{ cursor: 'pointer', color: 'var(--primary)' }}
                      onClick={() => navigate(`/feedback/${f.id}`)}
                    >
                      {f.is_pinned && '📌 '}{f.title}
                    </span>
                  </td>

                  <td>
                    {f.category && <Badge label={f.category.name} color={f.category.color} />}
                  </td>

                  <td><StatusBadge status={f.status} /></td>
                  <td className="font-medium">{f.votes_count}</td>
                  <td>{f.comments_count}</td>
                  <td className="text-muted text-sm">{f.user?.name}</td>
                  <td className="text-muted text-sm">
                    {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                  </td>

                  <td>
                    <div className="table-action-btns">
                      <button onClick={() => openStatusModal(f)}><Edit2 size={13} /></button>

                      <button onClick={() => handleTogglePin(f.id)}>
                        {f.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                      </button>

                      <button onClick={() => setDeleteModal(f.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {feedback.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32 }}>
                    No feedback found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={pagination.current_page}
        lastPage={pagination.last_page}
        onPageChange={setPage}
      />

      {/* Status Modal */}
      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title="Update Feedback Status"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStatusModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={actionLoading}>
              {actionLoading ? 'Saving…' : 'Update Status'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={statusForm.status}
            onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{formatStatusLabel(s)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Admin response (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Admin response (optional)"
            value={statusForm.admin_response}
            onChange={e => setStatusForm(f => ({ ...f, admin_response: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Feedback"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this feedback item? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}