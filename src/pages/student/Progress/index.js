import React from 'react';
import styles from './index.module.scss';

export default function StudentProgress() {
  return (
    <div className={styles.wrap}>
      <h1>Progress (Student)</h1>
      <p>Theo dõi trạng thái nộp: đã nộp, muộn, chưa nộp; cảnh báo gần hạn.</p>
    </div>
  );
} 