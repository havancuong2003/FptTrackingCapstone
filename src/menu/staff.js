const staffMenu = [
  // Trang chủ
  { 
    path: "/dashboard", 
    label: "Dashboard", 
    icon: "🏠"
  },
  // Quản lý học kỳ
  {
    path: "/category-management",
    label: "Semester Management",
    icon: "📋",
    hasSubmenu: true,
    children: [
      { path: "/category-management/semesters", label: "Semester List" },
      {
        path: "/category-management/semester/create",
        label: "Create Semester",
      },
    ],
  },
  // Quản lý nhóm
  {
    path: "/staff/groups",
    label: "Group Management",
    icon: "👥",
    hasSubmenu: true,
    children: [
      { path: "/staff/groups", label: "Group List" },
      { path: "/staff/groups/sync", label: "Sync Groups" },
    ],
  },
  // Quản lý mốc và giao hàng
  {
    path: "/milestones",
    label: "Milestones Management",
    icon: "📋",
    hasSubmenu: true,
    children: [
      { path: "/milestones", label: "Milestones" },
      { path: "/delivery-management", label: "Delivery Item" },
    ],
  },
  // Quản lý chuyên ngành
  { 
    path: "/staff/major", 
    label: "Major Management",
    icon: "🎓"
  },
];

export default staffMenu;
