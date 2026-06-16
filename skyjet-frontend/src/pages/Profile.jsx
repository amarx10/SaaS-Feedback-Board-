import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';
import Avatar from '../components/common/Avatar';
import { Camera, Save, Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    name: '',
    bio: '',
    date_of_birth: '',
    password: '',
    password_confirmation: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const today = new Date();
  const maxDob = new Date(today);
  maxDob.setFullYear(maxDob.getFullYear() - 16);
  const minDob = new Date(today);
  minDob.setFullYear(minDob.getFullYear() - 100);
  const formatDateInput = (date) => date.toISOString().slice(0, 10);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        date_of_birth: user.date_of_birth || '',
        password: '',
        password_confirmation: '',
      });
    }
  }, [user]);

  const handleChange = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, avatar: 'Please upload a JPG, PNG, or WEBP image.' }));
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, avatar: 'Image must be smaller than 2MB.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, avatar: undefined }));
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const getAge = (dateString) => {
    const dob = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  };

  const handleSave = async () => {
    if (form.date_of_birth) {
      const dob = new Date(form.date_of_birth);
      if (isNaN(dob.getTime())) {
        setErrors({ date_of_birth: 'Please enter a valid date of birth.' });
        return;
      }

      const age = getAge(form.date_of_birth);
      if (age < 16) {
        setErrors({ date_of_birth: 'You must be at least 16 years old.' });
        return;
      }
      if (age > 100) {
        setErrors({ date_of_birth: 'Date of birth must be within the last 100 years.' });
        return;
      }
    }

    setLoading(true);
    setErrors({});
    try {
      const payload = { name: form.name, bio: form.bio, date_of_birth: form.date_of_birth || undefined };
      if (form.password) {
        if (form.password !== form.password_confirmation) {
          setErrors({ password_confirmation: 'Passwords do not match' });
          setLoading(false);
          return;
        }
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      await authApi.updateProfile(payload);

      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await authApi.uploadAvatar(fd);
      }

      await refreshUser();
      toast.success('Profile updated!');
      setForm(f => ({ ...f, password: '', password_confirmation: '' }));
      setAvatarFile(null);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v; });
        setErrors(mapped);
      } else {
        toast.error(data?.message || 'Update failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="profile-header-card">
        <div className="profile-avatar-wrap">
          <Avatar user={avatarPreview ? { ...user, avatar_url: avatarPreview } : user} size="xl" />
          <label htmlFor="avatar-input" className="profile-avatar-edit" title="Change photo">
            <Camera size={12} />
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          {errors.avatar && <p className="form-error" style={{ marginTop: 8 }}>{errors.avatar}</p>}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-username">@{user.username}</p>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
            {user.is_admin && (
              <span className="badge" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          Profile Info
        </button>
        <button className={`tab-btn ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
          Password
        </button>
      </div>

      {tab === 'profile' && (
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={user.username} disabled style={{ opacity: 0.6 }} />
              <p className="form-hint">Username cannot be changed.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user.email} disabled style={{ opacity: 0.6 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                className="form-input"
                type="date"
                min={formatDateInput(minDob)}
                max={formatDateInput(maxDob)}
                value={form.date_of_birth}
                onChange={e => handleChange('date_of_birth', e.target.value)}
              />
              {errors.date_of_birth && <p className="form-error">{errors.date_of_birth}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Tell us about yourself…"
                value={form.bio}
                onChange={e => handleChange('bio', e.target.value)}
                maxLength={500}
              />
              <p className="form-hint">{form.bio.length}/500 characters</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <Save size={14} />
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-muted mb-4">
              Leave the fields blank if you don't want to change your password.
            </p>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Repeat new password"
                value={form.password_confirmation}
                onChange={e => handleChange('password_confirmation', e.target.value)}
              />
              {errors.password_confirmation && <p className="form-error">{errors.password_confirmation}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <Save size={14} />
                {loading ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}