const supervisorMenu = [
  // Chức năng chung (cùng thứ tự với student)
  {
    path: "/supervisor/calendar", 
    label: "Calendar", 
    icon: "📅"
  },
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
    label: "Documents", 
    icon: "📦"
  },
  { 
    path: "/supervisor/evaluation", 
    label: "Evaluation", 
    icon: "⭐"
  },
  { 
    path: "/supervisor/penalty-management", 
    label: "Penalty Management", 
    icon: "⚠️"
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
