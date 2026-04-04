import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// محلياً: تخطي تسجيل الدخول - الدخول مباشرة للوحة التحكم
const SKIP_AUTH = import.meta.env.DEV;
const FAKE_ADMIN = { id: 1, name: 'مدير النظام', email: 'admin@rybella.iq', role: 'admin' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (SKIP_AUTH) {
      setUser(FAKE_ADMIN);
      setLoading(false);
      return;
    }
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
