import React from 'react';
import styles from './TaskPermissionNotice.module.scss';

export default function TaskPermissionNotice({
  permissions,
  groupName,
  className = '',
}) {
  if (!permissions) return null;

  if (permissions.loading) return null;

  const { isGroupExpired, canEditTask } = permissions;
  if (!isGroupExpired && canEditTask) {
    return null;
  }

  const reason = isGroupExpired
    ? 'The group has expired so all edit operations are locked.'
    : 'You do not have permission to edit this task.';

  return (
    <div className={`${styles.notice} ${className}`.trim()}>
      <div className={styles.title}>View mode</div>
      <p className={styles.message}>
        {reason} {groupName ? `(${groupName})` : ''}
      </p>
    </div>
  );
}

