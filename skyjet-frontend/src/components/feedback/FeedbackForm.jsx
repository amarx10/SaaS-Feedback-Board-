import { useState, useEffect } from 'react';
import { feedbackApi } from '../../api/feedback';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

export default function FeedbackForm({ open, onClose, onSuccess, existing }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category_id: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || []));
  }, []);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description,
        category_id: existing.category?.id || '',
      });
    } else {
      setForm({ title: '', description: '', category_id: '' });
    }
    setErrors({});
  }, [existing, open]);

  const handleChange = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category_id) e.category_id = 'Please select a category';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      if (existing) {
        await feedbackApi.update(existing.id, form);
        toast.success('Feedback updated!');
      } else {
        await feedbackApi.create(form);
        toast.success('Feedback submitted!');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else toast.error(data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit Feedback' : 'Submit Feedback'}
      subtitle="Share your ideas, report bugs, or suggest improvements."
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : existing ? 'Update' : 'Submit'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Title <span className="required">*</span></label>
        <input
          className="form-input"
          placeholder="Short, descriptive title"
          value={form.title}
          onChange={e => handleChange('title', e.target.value)}
          maxLength={200}
        />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Description <span className="required">*</span></label>
        <textarea
          className="form-textarea"
          placeholder="Describe your idea or issue in detail…"
          rows={4}
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          maxLength={2000}
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Category <span className="required">*</span></label>
        <select
          className="form-select"
          value={form.category_id}
          onChange={e => handleChange('category_id', e.target.value)}
        >
          <option value="">Select a category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category_id && <p className="form-error">{errors.category_id}</p>}
      </div>
    </Modal>
  );
}