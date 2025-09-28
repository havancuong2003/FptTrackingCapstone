import React from 'react';
import { getCurrentUser } from '../../auth/auth';
import { Role } from '../../auth/rbac';
import StudentReports from '../student/Reports';
import TeacherReports from '../teacher/Reports';
import StaffReports from '../staff/Reports';

export default function ReportsPage() {
  const { role } = getCurrentUser();
  if (role === Role.TEACHER) return <TeacherReports />;
  if (role === Role.STAFF) return <StaffReports />;
  return <StudentReports />;
} 