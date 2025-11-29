import React from 'react';
import { getUserInfo } from '../auth/auth';
import { getCapstoneGroupDetail } from '../api/staff/groups';

const TEACHER_ROLES = ['TEACHER', 'SUPERVISOR', 'MENTOR'];

const getCreatorId = (task) => {
  if (!task) return null;
  return (
    task.createdById ??
    task.createdBy ??
    task.createById ??
    task.createBy ??
    task.createdUserId ??
    null
  );
};

export default function useTaskPermissions({ groupId, task, currentUser } = {}) {
  const [state, setState] = React.useState({
    loading: true,
    isGroupExpired: false,
    canEditTask: false,
    canManageAttachments: false,
    canCreateTask: false,
    canComment: true,
    isTaskCreator: false,
    userRole: '',
    roleInGroup: '',
  });

  React.useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      const user = currentUser || getUserInfo();
      const normalizedGroupId = groupId ? Number(groupId) : null;

      let isExpired = false;
      let hasResolvedGroupStatus = false;

      if (normalizedGroupId && user?.groupsInfo?.length) {
        const matchedGroup = user.groupsInfo.find(
          (g) => String(g.id) === String(normalizedGroupId)
        );
        if (matchedGroup && typeof matchedGroup.isExpired === 'boolean') {
          isExpired = matchedGroup.isExpired;
          hasResolvedGroupStatus = true;
        }
      }

      if (!hasResolvedGroupStatus && normalizedGroupId) {
        try {
          const response = await getCapstoneGroupDetail(normalizedGroupId);
          if (response.status === 200 && response.data) {
            const apiGroup = response.data;
            if (typeof apiGroup.isExpired === 'boolean') {
              isExpired = apiGroup.isExpired;
            } else if (apiGroup.status) {
              isExpired = String(apiGroup.status).toLowerCase() !== 'active';
            }
          }
        } catch (error) {
          console.warn('Không thể lấy thông tin group khi tính quyền task:', error);
        }
      }

      const userRole = user?.role?.toUpperCase() || '';
      const roleInGroup = user?.roleInGroup?.toUpperCase() || '';
      const isTeacher = TEACHER_ROLES.includes(userRole);
      const isSecretary = roleInGroup === 'SECRETARY';
      const creatorId = getCreatorId(task);
      const isTaskCreator =
        !!(creatorId && user?.id && String(creatorId) === String(user.id));

      const isReadOnly = Boolean(isExpired);
      const canEdit = !isReadOnly && (isTeacher || isSecretary || isTaskCreator);
      const canManageAttachments =
        !isReadOnly && (isTeacher || isSecretary || isTaskCreator);
      const canCreateTask = !isReadOnly && (isTeacher || isSecretary);
      const canComment = !isReadOnly;

      if (!cancelled) {
        setState({
          loading: false,
          isGroupExpired: isReadOnly,
          canEditTask: canEdit,
          canManageAttachments,
          canCreateTask,
          canComment,
          isTaskCreator,
          userRole,
          roleInGroup,
        });
      }
    };

    evaluate();

    return () => {
      cancelled = true;
    };
  }, [
    groupId,
    currentUser?.id,
    task?.createdById,
    task?.createdBy,
    task?.createById,
    task?.createBy,
    task?.createdUserId,
  ]);

  return state;
}

