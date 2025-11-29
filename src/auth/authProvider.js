import React from 'react';
import { USER_INFO_KEY, USER_ROLE_KEY, getUserInfo } from './auth';

const AuthContext = React.createContext({ status: 'loading', user: null, refresh: async () => {} });

export function AuthProvider({ children }) {
  const [status, setStatus] = React.useState('loading');
  const [user, setUser] = React.useState(null);

  const fetchMe = React.useCallback(() => {
    setStatus('loading');

    // Lấy thông tin user từ localStorage, không gọi API
    const userInfo = getUserInfo();
    
    if (!userInfo) {
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    // Normalize user data để đảm bảo format nhất quán
    const normalizedUser = {
      id: userInfo.id || 'u_1',
      name: userInfo.name || 'User',
      role: (userInfo.role || 'STUDENT').toUpperCase(),
      // Giữ nguyên các thông tin khác nếu cần
      semesterId: userInfo.semesterId,
      roleInGroup: userInfo.roleInGroup,
      campusId: userInfo.campusId,
      groups: userInfo.groups || []
    };
    
    setUser(normalizedUser);
    setStatus('authenticated');
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