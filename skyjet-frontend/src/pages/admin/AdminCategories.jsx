import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const PRESET_COLORS = [
  '#2563EB','#7C3AED','#059669','#D97706','#EF4444',
  '#EC4899','#0EA5E9','#F97316','#6366F1','#14B8A6',
];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | category object
  const [form, setForm] = useState({ name: '', slug: '', color: '#2563EB' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data.data || []);
    } catch { toast.error('Failed to load categories. Please refresh.');}
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ name: '', slug: '', color: '#2563EB' });
    setErrors({});
    setModal('create');
  };

  const openEdit = (cat) => {
    setForm({ name: cat.name, slug: cat.slug, color: cat.color || '#2563EB' });
    setErrors({});
    setModal(cat);
  };

  const handleNameChange = (v) => {
    setForm(f => ({ ...f, name: v, slug: slugify(v) }));
    setErrors(e => ({ ...e, name: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        await adminApi.createCategory(form);
        toast.success('Category created');
      } else {
        await adminApi.updateCategory(modal.id, { name: form.name, color: form.color });
        toast.success('Category updated');
      }
      setModal(null);
      load();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v; });
        setErrors(mapped);
      } else {
        toast.error(data?.message || 'Failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await adminApi.deleteCategory(deleteModal.id);
      toast.success('Category deleted');
      setDeleteModal(null);
      load();
    } catch { toast.error('Failed — category may have feedback attached'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Categories</h1>
            <p className="page-subtitle">Manage feedback categories.</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={14} /> New Category
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Feedback Count</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>
                  <span style={{
                    display: 'inline-block', width: 20, height: 20,
                    borderRadius: '50%', background: cat.color || '#2563EB',
                  }} />
                </td>
                <td className="font-medium">{cat.name}</td>
                <td className="text-muted text-sm">{cat.slug}</td>
                <td>{cat.feedback_count || 0}</td>
                <td>
                  <div className="table-action-btns">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(cat)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-danger-ghost btn-sm btn-icon" onClick={() => setDeleteModal(cat)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                  No categories yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'New Category' : 'Edit Category'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : modal === 'create' ? 'Create' : 'Save'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Name <span className="required">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. Feature Request"
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Slug <span className="required">*</span></label>
          <input
            className="form-input"
            placeholder="feature-request"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            disabled={modal !== 'create'}
            style={modal !== 'create' ? { opacity: 0.6 } : {}}
          />
          {errors.slug && <p className="form-error">{errors.slug}</p>}
          {modal === 'create' && <p className="form-hint">Auto-generated from name. Used in URLs.</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                  outline: form.color === c ? `3px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 44, height: 34, border: 'var(--border-width) solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
            <input className="form-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ flex: 1 }} placeholder="#2563EB" />
          </div>
        </div>

      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Category"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Delete <strong>{deleteModal?.name}</strong>? This may fail if feedback items are attached to it.
        </p>
      </Modal>
    </div>
  );
}