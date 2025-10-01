import React from 'react';
import client from '../utils/axiosClient';
import { USER_INFO_KEY, USER_ROLE_KEY } from './auth';

const AuthContext = React.createContext({ status: 'loading', user: null, refresh: async () => {} });

export function AuthProvider({ children }) {
  const [status, setStatus] = React.useState('loading');
  const [user, setUser] = React.useState(null);

  const fetchMe = React.useCallback(async () => {
    setStatus('loading');
    try {
      // --- mock/local ---
      try {
        const raw = localStorage.getItem(USER_INFO_KEY);
        console.log('raw', raw);
        if (raw) {
          const u = JSON.parse(raw);
          setUser({ id: u.id || 'u_1', name: u.name || 'User', role: u.role || 'STUDENT' });
          setStatus('authenticated');
          return;
        }
        // Fallback: chỉ có role = STAFF thì mock user Staff
        const role = localStorage.getItem(USER_ROLE_KEY);
        if (role === 'STAFF') {
          setUser({ id: 'u_1', name: 'Staff', role: 'STAFF' });
          setStatus('authenticated');
          return;
        }
      } catch {}

      // Khi dùng mock (không có user local), không gọi API thật
      setUser(null);
      setStatus('unauthenticated');
      return;

      // Nếu cần dùng API thật, bật lại đoạn sau:
      // const res = await client.get('/auth/me');
      // const body = res?.data;
      // const me = body?.data || body || null;
      // if (me) {
      //   setUser({ id: me.id || me.userId || 'u_1', name: me.name || me.fullName || 'User', role: me.role || 'STUDENT' });
      //   setStatus('authenticated');
      // } else {
      //   setUser(null);
      //   setStatus('unauthenticated');
      // }
    } catch {
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