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
    ? 'Nhóm đã hết hạn nên tất cả thao tác chỉnh sửa đều bị khóa.'
    : 'Bạn không có quyền chỉnh sửa công việc này.';

  return (
    <div className={`${styles.notice} ${className}`.trim()}>
      <div className={styles.title}>Chế độ chỉ xem</div>
      <p className={styles.message}>
        {reason} {groupName ? `(${groupName})` : ''}
      </p>
    </div>
  );
}

