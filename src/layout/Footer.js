import React from 'react';
import styles from './Footer.module.scss';
import { VERSION } from '../app/config';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      © {year} FPT Tracking Capstone · v{VERSION}
    </footer>
  );
} 