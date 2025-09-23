import React from 'react';
import styles from './Footer.module.scss';
import { VERSION } from '../app/config';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      © {year} React Core FE · v{VERSION}
    </footer>
  );
} 