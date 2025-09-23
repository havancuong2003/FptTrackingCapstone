import React from 'react';
import styles from './Textarea.module.scss';

export default function Textarea(props) {
  return <textarea className={styles.textarea} {...props} />;
} 