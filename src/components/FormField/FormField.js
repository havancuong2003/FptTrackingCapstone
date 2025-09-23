import React from 'react';
import styles from './FormField.module.scss';

export default function FormField({ label, hint, error, children }) {
  return (
    <div className={styles.field}>
      {label && <div className={styles.label}>{label}</div>}
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
} 