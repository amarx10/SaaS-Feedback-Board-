import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const normalizeUser = (userData) => ({
    ...userData,
    // is_super_admin is determined server-side only
    is_super_admin: userData?.is_super_admin ?? false,
  });

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('skyjet_user');
      return storedUser ? normalizeUser(JSON.parse(storedUser)) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('skyjet_token'));
  const [loading, setLoading] = useState(true);

  const saveSession = (userData, tok) => {
    const normalizedUser = normalizeUser(userData);

    setUser(normalizedUser);
    setToken(tok);

    localStorage.setItem('skyjet_user', JSON.stringify(normalizedUser));
    localStorage.setItem('skyjet_token', tok);
  };

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);

    localStorage.removeItem('skyjet_user');
    localStorage.removeItem('skyjet_token');
  }, []);

  // Restore user session on application startup
  useEffect(() => {
    if (token) {
      authApi.me()
        .then((res) => {
          setUser(normalizeUser(res.data.data));
        })
        .catch(() => {
          clearSession();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, clearSession]);

  // Listen for global logout events from axios
  useEffect(() => {
    const handleLogout = () => {
      clearSession();
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [clearSession]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);

    const { user: userData, token: authToken } = res.data.data;

    saveSession(userData, authToken);

    return userData;
  };

  const register = async (data) => {
    const res = await authApi.register(data);

    const { user: userData, token: authToken } = res.data.data;

    saveSession(userData, authToken);

    return userData;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API logout errors
    }

    clearSession();
  };

  const refreshUser = async () => {
    const res = await authApi.me();

    const updatedUser = normalizeUser(res.data.data);

    setUser(updatedUser);

    localStorage.setItem(
      'skyjet_user',
      JSON.stringify(updatedUser)
    );

    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin: user?.is_admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};