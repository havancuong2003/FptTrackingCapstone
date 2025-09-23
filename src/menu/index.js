import { Role } from '../auth/rbac';
import adminMenu from './admin';
import staffMenu from './staff';
import studentMenu from './student';
import teacherMenu from './teacher';

export function getMenuForRole(role) {
  switch (role) {
    case Role.ADMIN:
      return adminMenu;
    case Role.STAFF:
      return staffMenu;
    case Role.STUDENT:
      return studentMenu;
    case Role.TEACHER:
      return teacherMenu;
    default:
      return studentMenu;
  }
} 