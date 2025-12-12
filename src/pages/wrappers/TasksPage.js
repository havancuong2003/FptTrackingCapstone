import React from 'react';
import { getCurrentUser } from '../../auth/auth';
import { Role } from '../../auth/rbac';
import StudentTasks from '../student/Tasks';
import StaffTasks from '../staff/Tasks';

export default function TasksPage() {
  const { role } = getCurrentUser();
  if (role === Role.STAFF) return <StaffTasks />;
  return <StudentTasks />;
} 