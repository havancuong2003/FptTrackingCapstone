import React from 'react';
import styles from './Checkbox.module.scss';

export default function Checkbox({ label, checked, onChange, ...rest }) {
  return (
    <label className={styles.checkbox}>
      <input type="checkbox" checked={checked} onChange={e => onChange?.(e.target.checked)} {...rest} />
      <span>{label}</span>
    </label>
  );
} 