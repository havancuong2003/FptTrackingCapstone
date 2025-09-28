import React from 'react';
import { getCurrentUser } from '../../auth/auth';
import { Role } from '../../auth/rbac';
import StudentTasks from '../student/Tasks';
import TeacherTasks from '../teacher/Tasks';
import StaffTasks from '../staff/Tasks';

export default function TasksPage() {
  const { role } = getCurrentUser();
  if (role === Role.TEACHER) return <TeacherTasks />;
  if (role === Role.STAFF) return <StaffTasks />;
  return <StudentTasks />;
} 