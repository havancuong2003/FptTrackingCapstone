import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/authProvider';

export default function RedirectToLogin() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return null;
  const target = status === 'authenticated' ? '/dashboard' : '/login';
  if (location.pathname === target) return null;
  return <Navigate to={target} replace />;
} 