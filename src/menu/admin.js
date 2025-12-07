const adminMenu = [
  // Trang chủ
  { 
    path: '/dashboard', 
    label: 'Dashboard'
  },
  // Management menu với submenu
  {
    path: '/management',
    label: 'Management',
    hasSubmenu: true,
    children: [
      { path: '/admin/campus-slot', label: 'Campus & Slot' },
      { path: '/admin/storage', label: 'Storage' },
    ],
  },
  // Config menu với submenu
  {
    path: '/config',
    label: 'Config',
    hasSubmenu: true,
    children: [
      { path: '/system', label: 'Email Config' },
      { path: '/admin/course-size-config', label: 'Course Size Config' },
      { path: '/admin/ai-settings', label: 'AI Settings' },
    ],
  },
];

export default adminMenu;
