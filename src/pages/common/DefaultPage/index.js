import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../auth/authProvider';
import styles from './index.module.scss';

export default function DefaultPage() {
  const { user, status } = useAuth();

  // Nếu đang loading, hiển thị loading
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, redirect về login
  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect dựa trên role
  const userRole = user.role?.toUpperCase();
  
  if (userRole === 'STUDENT') {
    return <Navigate to="/student/home" replace />;
  }
  
  if (userRole === 'SUPERVISOR') {
    return <Navigate to="/supervisor/calendar" replace />;
  }

  // Các role khác giữ nguyên trang mặc định
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <h1 className={styles.title}>No content selected</h1>
        <p className={styles.description}>
          Click on the menu to access system functions.
        </p>
        <div className={styles.hint}>
          <p>Use the left menu to navigate to different pages</p>
        </div>
      </div>
    </div>
  );
}
