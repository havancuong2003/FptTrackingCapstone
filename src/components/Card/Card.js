import React from 'react';
import styles from './Card.module.scss';

export default function Card({ title, children }) {
  return (
    <div className={styles.card}>
      {title && <div className={styles.title}>{title}</div>}
      <div>{children}</div>
    </div>
  );
} 