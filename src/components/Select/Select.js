import React from 'react';
import styles from './Select.module.scss';

export default function Select({ options = [], ...props }) {
  return (
    <select className={styles.select} {...props}>
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
} 