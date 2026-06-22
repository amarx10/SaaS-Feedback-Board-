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
    current_password: '',     
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
        current_password: '',  
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
      setErrors(prev => ({ ...prev, avatar: 'Please upload a JPG, PNG, or WEBP image.' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Image must be smaller than 2MB.' }));
      return;
    }

    setErrors(prev => ({ ...prev, avatar: undefined }));
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const getAge = (dateString) => {
    const dob = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const handleSave = async () => {
    if (form.date_of_birth) {
      const age = getAge(form.date_of_birth);
      if (age < 16) return setErrors({ date_of_birth: 'Must be at least 16 years old.' });
      if (age > 100) return setErrors({ date_of_birth: 'Invalid date of birth.' });
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        date_of_birth: form.date_of_birth || undefined,
      };

      if (tab === 'security' &&form.password) {
        if (form.password !== form.password_confirmation) {
          setErrors({ password_confirmation: 'Passwords do not match' });
          setLoading(false);
          return;
        }

        payload.current_password = form.current_password; // ✅ REQUIRED BY BACKEND
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }

      await authApi.updateProfile(payload);

      if (avatarFile) {
        try {
          const fd = new FormData();
          fd.append('avatar', avatarFile);
          await authApi.uploadAvatar(fd);
        } catch {
          await refreshUser();
          toast.error('Profile saved, but avatar upload failed. Please try again.');
          setAvatarFile(null);
          setLoading(false);
          return;
        }
      }

      await refreshUser();
      toast.success('Profile updated!');

      setForm(f => ({
        ...f,
        password: '',
        password_confirmation: '',
        current_password: '',   // reset
      }));

      setAvatarFile(null);
    } catch (err) {
      const data = err.response?.data;

      if (data?.errors) {
        const mapped = {};
        Object.entries(data.errors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : v;
        });
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
          <label htmlFor="avatar-input" className="profile-avatar-edit">
            <Camera size={12} />
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
          {errors.avatar && <p className="form-error">{errors.avatar}</p>}
        </div>

        <div className="profile-info">
          <h1>{user.name}</h1>
          <p>@{user.username}</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button onClick={() => setTab('profile')} className={`profile-tab ${tab === 'profile' ? 'active' : ''}`}>
          Profile Info
        </button>
        <button onClick={() => setTab('security')} className={`profile-tab ${tab === 'security' ? 'active' : ''}`}>
          Password
        </button>
      </div>

     {/* PROFILE TAB */}
{tab === 'profile' && (
  <div className="profile-card">
    <div className="card-body">

      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input
          className="form-input"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
        />
        {errors.name && (
          <p className="form-error">{errors.name}</p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Bio</label>
        <textarea
          className="form-textarea"
          rows={3}
          placeholder="Tell us about yourself..."
          value={form.bio}
          onChange={e => handleChange('bio', e.target.value)}
          maxLength={500}
        />
        <p className="form-hint">
          {form.bio.length}/500 characters
        </p>
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
        {errors.date_of_birth && (
          <p className="form-error">{errors.date_of_birth}</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          <Save size={14} />
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

    </div>
  </div>
)}
      {/* SECURITY TAB */}
      {tab === 'security' && (
        <div className="profile-card">
          <div className="card-body">

          
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={form.current_password}
                onChange={e => handleChange('current_password', e.target.value)}
              />
              {errors.current_password && (
                <p className="form-error">{errors.current_password}</p>
              )}
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="form-input"
                value={form.password_confirmation}
                onChange={e => handleChange('password_confirmation', e.target.value)}
              />
              {errors.password_confirmation && (
                <p className="form-error">{errors.password_confirmation}</p>
              )}
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              <Save size={14} />
              {loading ? 'Saving…' : 'Update Password'}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}