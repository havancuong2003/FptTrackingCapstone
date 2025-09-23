import React from 'react';
import styles from './RadioGroup.module.scss';

export default function RadioGroup({ name, options = [], value, onChange }) {
  return (
    <div className={styles.group} role="radiogroup">
      {options.map(opt => (
        <label key={opt.value} className={styles.item}>
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
} 