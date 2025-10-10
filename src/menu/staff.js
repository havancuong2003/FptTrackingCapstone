const staffMenu = [
  { path: "/dashboard", label: "Dashboard", children: [
    
  ] },
  { path: "/staff/groups", label: "Nhóm Capstone" },
  // { path: "/reports", label: "Báo cáo & Đánh giá" },
  // { path: "/analytics", label: "Dashboard thống kê" },
  // { path: "/templates", label: "Template báo cáo" },
  // { path: "/tasks", label: "Quản lý Task" },
 // { path: "/settings", label: "Settings" }, 
  { path: "/tracking", label: "Capstone Tracking" },
  { path: "/milestones-management", label: "Milestones Management" },
  { path: "/delivery-management", label: "Delivery Management" },
  { 
    path: "/category-management", 
    label: "Quản lý kỳ học", 
    icon: "📋",
    hasSubmenu: true,
    children: [
      { path: "/category-management/semesters", label: "Danh sách kỳ học" },
      { path: "/category-management/semester/create", label: "Tạo kỳ học" },
  //    { path: "/category-management/vacation", label: "Quản lý tuần nghỉ" }
    ] 
  },
];

export default staffMenu;
