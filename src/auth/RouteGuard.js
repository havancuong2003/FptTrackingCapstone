import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authProvider';
import { hasRole } from './rbac';

const RouteGuard = ({ children, requiredRoles }) => {
  const { user, status } = useAuth();
  const location = useLocation();

  // Nếu đang loading, hiển thị loading
  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Nếu không đăng nhập, chuyển về trang login (trừ khi đang ở trang login)
  if (status !== 'authenticated') {
    if (location.pathname === '/login') {
      return children; // Cho phép truy cập trang login
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập và đang ở trang login, chuyển về trang chủ
  if (status === 'authenticated' && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  // Kiểm tra role có quyền truy cập route này không
  if (requiredRoles && requiredRoles.length > 0 && !hasRole(user, requiredRoles)) {
    // Hiển thị cảnh báo một lần rồi chuyển về trang chủ
    const alertedRef = useRef(false);
    useEffect(() => {
      if (!alertedRef.current) {
        alertedRef.current = true;
        try { window.alert('Bạn không có quyền truy cập.'); } catch {}
      }
    }, []);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RouteGuard;
