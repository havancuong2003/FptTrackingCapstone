import React from 'react';
import cls from '../../utils/cls';
import styles from './Button.module.scss';

export default function Button({
  as = 'button',
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  ...rest
}) {
  const Comp = as;
  const className = cls(
    styles.button,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    size === 'sm' && styles.sm,
    size === 'md' && styles.md,
    size === 'lg' && styles.lg,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    loading && styles.loading,
    rest.className,
  );

  return (
    <Comp className={className} disabled={disabled || loading} {...rest}>
      {loading ? 'Loading…' : children}
    </Comp>
  );
} 