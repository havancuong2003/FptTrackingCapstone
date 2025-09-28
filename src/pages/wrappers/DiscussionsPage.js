import React from 'react';
import { getCurrentUser } from '../../auth/auth';
import { Role } from '../../auth/rbac';
import StudentDiscussions from '../student/Discussions';

export default function DiscussionsPage() {
  const { role } = getCurrentUser();
  // Hiện chỉ student sử dụng, nếu mở rộng cho teacher thì thêm import và nhánh tại đây
  return <StudentDiscussions />;
} 