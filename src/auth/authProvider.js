import React from 'react';
import client from '../utils/axiosClient';
import { USER_INFO_KEY, USER_ROLE_KEY } from './auth';

const AuthContext = React.createContext({ status: 'loading', user: null, refresh: async () => {} });

export function AuthProvider({ children }) {
  const [status, setStatus] = React.useState('loading');
  const [user, setUser] = React.useState(null);

  const fetchMe = React.useCallback(async () => {
    setStatus('loading');

    // Chỉ kiểm tra phiên nếu có dữ liệu user trong localStorage
    const rawUser = localStorage.getItem(USER_INFO_KEY);
    if (!rawUser) {
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    try {
      const res = await client.get('/auth/user-info');
      const body = res?.data;
      const me = body?.data || body || null;
      if (me) {
        const normalizedUser = {
          id: me.id || me.userId || 'u_1',
          name: me.name || me.fullName || 'User',
          role: me.role || 'STUDENT',
        };
        setUser(normalizedUser);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(normalizedUser));
        if (normalizedUser.role) localStorage.setItem(USER_ROLE_KEY, normalizedUser.role);
        setStatus('authenticated');
      } else {
        localStorage.removeItem(USER_INFO_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch {
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  React.useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const value = React.useMemo(() => ({ status, user, refresh: fetchMe }), [status, user, fetchMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
} 