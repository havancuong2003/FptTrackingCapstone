import React from 'react';
import styles from './NotFound.module.scss';

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <h1>404</h1>
      <p>Trang không tồn tại.</p>
    </div>
  );
} 