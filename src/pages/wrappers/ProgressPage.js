import React from 'react';
import { getCurrentUser } from '../../auth/auth';
import { Role } from '../../auth/rbac';
import StudentProgress from '../student/Progress';
import TeacherProgress from '../teacher/Progress';
import StaffProgress from '../staff/Progress';

export default function ProgressPage() {
  const { role } = getCurrentUser();
  if (role === Role.TEACHER) return <TeacherProgress />;
  if (role === Role.STAFF) return <StaffProgress />;
  return <StudentProgress />;
} 