import React from 'react';
import styles from './Switch.module.scss';

export default function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`${styles.switch} ${checked ? styles.on : ''}`}
      onClick={() => onChange?.(!checked)}
    >
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </button>
  );
}
