import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const logoSrc = '/images/logo.png';

export default function Login() {
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.login.trim()) errs.login = 'Email or username is required';
    if (!form.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}!`);
      await refreshUser(); 
      navigate(user.is_admin ? '/admin' : '/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else toast.error(data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <img src={logoSrc} alt="SkyJet logo" className="auth-logo-image" />
        </div>

        <div className="auth-card">
          <h1 className="auth-card-title">Welcome back</h1>
          <p className="auth-card-subtitle">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <input
                className="form-input"
                placeholder="you@example.com or username"
                value={form.login}
                onChange={e => handleChange('login', e.target.value)}
                autoComplete="username"
              />
              {errors.login && <p className="form-error">{Array.isArray(errors.login) ? errors.login[0] : errors.login}</p>}
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  autoComplete="current-password"
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
              {errors.password && <p className="form-error">{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}