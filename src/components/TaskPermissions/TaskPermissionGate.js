import React from 'react';

const PERMISSION_FIELD = {
  edit: 'canEditTask',
  attachment: 'canManageAttachments',
  comment: 'canComment',
  create: 'canCreateTask',
};

export default function TaskPermissionGate({
  permissions,
  permission = 'view',
  fallback = null,
  children,
}) {
  if (!permissions) return null;
  if (permission === 'view') {
    return <>{children}</>;
  }

  const field = PERMISSION_FIELD[permission];
  if (!field) {
    return <>{children}</>;
  }

  const allowed = Boolean(permissions[field]);
  return allowed ? <>{children}</> : fallback;
}

