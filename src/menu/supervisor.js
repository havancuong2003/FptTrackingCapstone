const supervisorMenu = [
  // Quản lý nhóm - quan trọng nhất
  {
    path: "/supervisor/calendar", 
    label: "Calendar", 
    icon: "📅"
  },
  { 
    label: "Groups", 
    icon: "👥",
    children: [
      { path: "/supervisor/groups/active", label: "Active" },
      { path: "/supervisor/groups/expired", label: "Expired" }
    ]
  },
  // Quản lý công việc
  { 
    path: "/supervisor/tasks", 
    label: "Issues", 
    icon: "✅"
  },
  // Quản lý lịch trình và cuộc họp
  
  { 
    path: "/supervisor/schedule", 
    label: "Schedule Management", 
    icon: "📆"
  },
  { 
    path: "/supervisor/meetings", 
    label: "Meeting Management", 
    icon: "🤝"
  },
  { 
    path: "/supervisor/documents", 
    label: "Documents", 
    icon: "📦"
  },
  { 
    label: "Evaluation Management", 
    icon: "⭐",
    children: [
      { path: "/supervisor/evaluation", label: "Evaluation List" },
      { path: "/supervisor/penalty-management", label: "Penalty List" }
    ]
  },
  { 
    path: "/supervisor/tracking", 
    label: "Tracking", 
    icon: "📊"
  },


];

export default supervisorMenu;
