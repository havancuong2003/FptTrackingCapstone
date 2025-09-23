import { Role } from '../auth/rbac';

export const menuItems = [
  {
    path: '/',
    label: 'Home',
    canAccess: () => true,
  },
  {
    path: '/dashboard',
    label: 'Dashboard',
    canAccess: (user) => [Role.ADMIN, Role.EDITOR, Role.VIEWER].includes(user.role),
  },
  {
    path: '/settings',
    label: 'Settings',
    canAccess: (user) => [Role.ADMIN, Role.EDITOR].includes(user.role),
  },
]; 