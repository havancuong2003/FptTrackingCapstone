import React from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.scss';

export default function Modal({ open, onClose, children, showCloseButton = true }) {
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        {showCloseButton && <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>}
        {children}
      </div>
    </div>,
    modalRoot
  );
} 