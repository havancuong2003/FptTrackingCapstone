import React from 'react';
import styles from './Tooltip.module.scss';

export default function Tooltip({ content, children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      className={styles.tooltip}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && <span role="tooltip" className={styles.bubble}>{content}</span>}
    </span>
  );
} 