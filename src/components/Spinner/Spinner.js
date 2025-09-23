import React from 'react';
import styles from './Spinner.module.scss';

export default function Spinner({ fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        <span className={styles.spinner} aria-label="Loading" />
      </div>
    );
  }
  return <span className={styles.spinner} aria-label="Loading" />;
} 