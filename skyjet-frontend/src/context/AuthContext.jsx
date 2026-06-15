import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('skyjet_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('skyjet_token'));
  const [loading, setLoading] = useState(true);

  const saveSession = (userData, tok) => {
    setUser(userData);
    setToken(tok);
    localStorage.setItem('skyjet_user', JSON.stringify(userData));
    localStorage.setItem('skyjet_token', tok);
  };

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('skyjet_user');
    localStorage.removeItem('skyjet_token');
  }, []);

  useEffect(() => {
    if (token) {
      authApi.me()
        .then(res => setUser(res.data.data))
        .catch(() => clearSession())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    await authApi.csrfCookie();
    const res = await authApi.login(credentials);
    const { user: u, token: t } = res.data.data;
    saveSession(u, t);
    return u;
  };

  const register = async (data) => {
    await authApi.csrfCookie();
    const res = await authApi.register(data);
    const { user: u, token: t } = res.data.data;
    saveSession(u, t);
    return u;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    clearSession();
  };

  const refreshUser = async () => {
    const res = await authApi.me();
    const u = res.data.data;
    setUser(u);
    localStorage.setItem('skyjet_user', JSON.stringify(u));
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, isAdmin: user?.is_admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};