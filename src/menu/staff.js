const staffMenu = [
  { 
    path: "/category-management", 
    label: "Semester Management", 
    icon: "📋",
    hasSubmenu: true,
    children: [
      { path: "/category-management/semesters", label: "Semester List" },
      { path: "/category-management/semester/create", label: "Create Semester" },
  //    { path: "/category-management/vacation", label: "Quản lý tuần nghỉ" }
    ] 
  },
  { path: "/milestones", label: "Milestones Management" ,
    children: [
      { path: "/milestones", label: "Milestones" },
      { path: "/delivery-management", label: "Delivery Item" },
    ]
  },

  { path: "/staff/groups", label: "Group Management" },
  // { path: "/reports", label: "Báo cáo & Đánh giá" },
  // { path: "/analytics", label: "Dashboard thống kê" },
  // { path: "/templates", label: "Template báo cáo" },
  // { path: "/tasks", label: "Quản lý Task" },
 // { path: "/settings", label: "Settings" }, 
  // { path: "/tracking", label: "Capstone Tracking" },
  { path: "/dashboard", label: "Dashboard", children: [
    
  ] },
  { path: "/staff/major", label: "Major Management" },
];

export default staffMenu;
