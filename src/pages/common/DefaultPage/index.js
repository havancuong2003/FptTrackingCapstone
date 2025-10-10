import React from 'react';
import styles from './index.module.scss';

export default function DefaultPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <h1 className={styles.title}>Chưa chọn nội dung nào</h1>
        <p className={styles.description}>
          Click vào menu để thực hiện các chức năng của hệ thống.
        </p>
        <div className={styles.hint}>
          <p>💡 Sử dụng menu bên trái để điều hướng đến các trang khác nhau</p>
        </div>
      </div>
    </div>
  );
}
