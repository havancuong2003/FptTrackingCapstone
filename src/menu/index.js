import { Role } from '../auth/rbac';
import adminMenu from './admin';
import staffMenu from './staff';
import studentMenu from './student';
import supervisorMenu from './supervisor';

export function getMenuForRole(role) {
  const normalized = String(role || '').toUpperCase();
  switch (normalized) {
    case Role.ADMIN:
      return adminMenu;
    case Role.STAFF:
      return staffMenu;
    case Role.STUDENT:
      return studentMenu;
    case Role.SUPERVISOR:
      return supervisorMenu;
    default:
      return studentMenu;
  }
} 