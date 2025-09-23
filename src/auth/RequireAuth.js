import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from './auth';
import { hasRole } from './rbac';

export default function RequireAuth({ roles, children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = getCurrentUser();
  const okRole = hasRole(user, roles);

  if (!okRole) {
    return <Navigate to="/" replace />;
  }

  return children;
} 