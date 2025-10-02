import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasRole } from './rbac';
import { useAuth } from './authProvider';

// export default function RequireAuth({ roles, children }) {
//   const location = useLocation();
//   const { status, user } = useAuth();

//   if (status === 'loading') {
//     return null;
//   }

//   if (status !== 'authenticated') {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   const okRole = hasRole(user, roles);
//   if (!okRole) {
//     return <Navigate to="/" replace />;
//   }

//   return children;
// } 

export default function RequireAuth({ role, children }) {
  const location = useLocation();
  const { status, user } = useAuth();

  if (status === 'loading') return null;                 // đừng điều hướng khi đang loading
  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && !hasRole(user, role)) {
    return <Navigate to="/forbidden" replace />;         // ✅ KHÔNG đưa về "/"
  }

  return children;
}
