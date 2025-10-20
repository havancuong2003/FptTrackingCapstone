const supervisorMenu = [
  // Chức năng chung (cùng thứ tự với student)
  { 
    path: "/supervisor/tasks", 
    label: "Issues", 
    icon: "✅"
  },
  { 
    path: "/supervisor/schedule", 
    label: "Schedule Management", 
    icon: "📅"
  },
  { 
    path: "/supervisor/meetings", 
    label: "Meeting Management", 
    icon: "📅"
  },
  { 
    path: "/supervisor/documents", 
    label: "Delivery Management", 
    icon: "📦"
  },
  { 
    path: "/supervisor/evaluation", 
    label: "Evaluation System", 
    icon: "⭐"
  },
  // Chức năng riêng của supervisor
  { 
    path: "/supervisor/groups", 
    label: "Groups", 
    icon: "👥"
  },
  { 
    path: "/supervisor/tracking", 
    label: "Tracking", 
    icon: "📊"
  }
];

export default supervisorMenu;
