const staffMenu = [
  { path: "/dashboard", label: "Dashboard", children: [
    { path: "/dashboard/subdashboard", label: "Subdashboard" },
  ] },
  { path: "/staff/groups", label: "Nhóm Capstone" },
  // { path: "/reports", label: "Báo cáo & Đánh giá" },
  // { path: "/analytics", label: "Dashboard thống kê" },
  // { path: "/templates", label: "Template báo cáo" },
  // { path: "/tasks", label: "Quản lý Task" },
 // { path: "/settings", label: "Settings" },
  { path: "/tracking", label: "Capstone Tracking" },
  { path: "/milestones", label: "Milestones Management" ,
    children: [
      { path: "/milestones", label: "Milestones" },
      { path: "/delivery-management", label: "Delivery Item" },
    ]
  },
];

export default staffMenu;
