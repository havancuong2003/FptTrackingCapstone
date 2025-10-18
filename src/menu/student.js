const studentMenu = [
  // Chức năng chung (cùng thứ tự với supervisor)
  { 
    path: "/student/tasks", 
    label: "Task Management", 
    icon: "✅"
  },
  { 
    path: "/schedule", 
    label: "Schedule", 
    icon: "📅"
  },
  { 
    path: "/student/meetings", 
    label: "Meeting Management", 
    icon: "📅"
  },
  { 
    path: "/student/documents", 
    label: "Documents", 
    icon: "📚"
  },
  { 
    path: "/student/evaluation", 
    label: "My Evaluation", 
    icon: "⭐"
  },
  // Chức năng riêng của student
  { 
    path: "/student/milestones", 
    label: "Milestones", 
    icon: "📋"
  },
  { 
    path: "/student/deliveries", 
    label: "Delivery Management", 
    icon: "📦"
  },
  { 
    path: "/student/minutes", 
    label: "Meeting Minutes", 
    icon: "📝"
  }
];

export default studentMenu;