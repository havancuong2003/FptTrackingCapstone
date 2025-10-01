import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasRole } from './rbac';
import { useAuth } from './authProvider';

export default function RequireAuth({ roles, children }) {
  const location = useLocation();
  const { status, user } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const okRole = hasRole(user, roles);
  if (!okRole) {
    return <Navigate to="/" replace />;
  }

  return children;
} 