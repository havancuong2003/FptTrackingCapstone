export interface MenuItemConfig {
  key: string
  label: string
  path?: string
  permission?: string
  roles?: string[]
  children?: MenuItemConfig[]
}

export const menuItems: MenuItemConfig[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'tracking', label: 'Tracking', path: '/tracking', permission: 'tracking.view' },
  { key: 'test', label: 'Test admin, đào tạo', path: '/test', permission: 'test.view' , roles: ['admin', 'dao_tao'] },
  {
    key: 'group-admin',
    label: 'Quản trị hệ thống',
    roles: ['admin'],
    children: [
      { key: 'admin', label: 'Trang Admin', path: '/admin' },
      { key: 'users', label: 'Quản lý người dùng', path: '/admin/users' },
    ],
  },
  {
    key: 'group-daotao',
    label: 'Phòng Đào Tạo',
    roles: ['dao_tao'],
    children: [
      { key: 'dao-tao', label: 'Trang Đào Tạo', path: '/dao-tao' },
      { key: 'courses', label: 'Quản lý học phần', path: '/dao-tao/courses' },
    ],
  },
  { key: 'giang-vien', label: 'Giảng viên', path: '/giang-vien', roles: ['giang_vien'] },
  { key: 'sinh-vien', label: 'Sinh viên', path: '/sinh-vien', roles: ['sinh_vien'] },
] 