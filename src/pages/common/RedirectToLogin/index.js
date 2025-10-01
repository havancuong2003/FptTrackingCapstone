import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../auth/authProvider';

export default function RedirectToLogin() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  const target = status === 'authenticated' ? '/dashboard' : '/login';
  return <Navigate to={target} replace />;
} 