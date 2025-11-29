import React from 'react';
import styles from './UnsavedChangesPrompt.module.scss';

export default function UnsavedChangesPrompt({
  open,
  title = 'Unsaved changes',
  message = 'Do you want to save your edits before leaving?',
  saving = false,
  primaryLabel = 'Save',
  secondaryLabel = 'Don’t save',
  cancelLabel = 'Cancel',
  onPrimary,
  onSecondary,
  onCancel,
  onClose,
}) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, saving, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (!saving) {
          onClose?.();
        }
      }}
    >
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.close}
          onClick={() => !saving && onClose?.()}
          aria-label="Đóng"
        >
          ×
        </button>
        <div className={styles.header}>
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={onPrimary}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : primaryLabel}
          </button>
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={onSecondary}
            disabled={saving}
          >
            {secondaryLabel}
          </button>
          <button
            className={`${styles.actionButton} ${styles.ghost}`}
            onClick={onCancel}
            disabled={saving}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

