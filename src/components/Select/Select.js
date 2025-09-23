import React from 'react';
import styles from './Select.module.scss';

export default function Select(props) {
  return <select className={styles.select} {...props} />;
} 