import React from 'react';
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
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ color: '#e74c3c', marginBottom: '20px' }}>🚫 Access Denied</h1>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Bạn không có quyền truy cập vào trang này.
        </p>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
          Role hiện tại: <strong>{user?.role}</strong><br/>
          Role được yêu cầu: <strong>{requiredRoles?.join(', ')}</strong>
        </p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  return children;
};

export default RouteGuard;
