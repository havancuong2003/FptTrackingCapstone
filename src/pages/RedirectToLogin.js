import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../auth/auth';

export default function RedirectToLogin() {
  const target = isAuthenticated() ? '/dashboard' : '/login';
  return <Navigate to={target} replace />;
} 