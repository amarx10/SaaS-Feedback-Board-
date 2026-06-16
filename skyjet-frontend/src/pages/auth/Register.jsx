import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Camera } from 'lucide-react';
import { authApi } from '../../api/auth';

const logoSrc = '/images/logo.png';

export default function Register() {
  const { register, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', password_confirmation: '',
    date_of_birth: '', bio: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await register(form);
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await authApi.uploadAvatar(fd);
        await refreshUser();
      }
      toast.success(`Welcome, ${user.name}!`);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const mapped = {};
        Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v; });
        setErrors(mapped);
      } else {
        toast.error(data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <img src={logoSrc} alt="SkyJet logo" className="auth-logo-image" />
        </div>

        <div className="auth-card">
          <h1 className="auth-card-title">Create account</h1>
          <p className="auth-card-subtitle">Join SkyJet and help build better products</p>

          <form onSubmit={handleSubmit}>
            {/* Avatar */}
            <div className="form-group">
              <label className="form-label">Profile Picture</label>
              <div className="auth-avatar-upload">
                <div className="auth-avatar-preview">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Preview" />
                    : <Camera size={20} color="var(--text-light)" />
                  }
                </div>
                <div>
                  <label htmlFor="avatar-upload" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    Choose Photo
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
                  <p className="form-hint">JPG, PNG, GIF up to 2MB</p>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => handleChange('name', e.target.value)} />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Username <span className="required">*</span></label>
                <input className="form-input" placeholder="johndoe" value={form.username} onChange={e => handleChange('username', e.target.value)} />
                {errors.username && <p className="form-error">{errors.username}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email <span className="required">*</span></label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => handleChange('email', e.target.value)} autoComplete="email" />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-row">
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Password <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                    style={{ paddingRight: 36 }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="required">*</span></label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Repeat password"
                  value={form.password_confirmation}
                  onChange={e => handleChange('password_confirmation', e.target.value)}
                />
                {errors.password_confirmation && <p className="form-error">{errors.password_confirmation}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-input" type="date" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} />
              {errors.date_of_birth && <p className="form-error">{errors.date_of_birth}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" rows={2} placeholder="Tell us about yourself…" value={form.bio} onChange={e => handleChange('bio', e.target.value)} maxLength={500} />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}