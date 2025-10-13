import React from "react";

const RedirectToLogin = React.lazy(() =>
  import("../pages/common/RedirectToLogin")
);
const Home = React.lazy(() => import("../pages/common/Home"));
const Login = React.lazy(() => import("../pages/common/Login"));
const Dashboard = React.lazy(() => import("../pages/common/Dashboard"));
const Settings = React.lazy(() => import("../pages/common/Settings"));
const ComponentsDemo = React.lazy(() =>
  import("../pages/common/ComponentsDemo")
);
const NotFound = React.lazy(() => import("../pages/common/NotFound"));
// Wrappers theo role
const Tasks = React.lazy(() => import("../pages/wrappers/TasksPage"));
const Reports = React.lazy(() => import("../pages/wrappers/ReportsPage"));
const Progress = React.lazy(() => import("../pages/wrappers/ProgressPage"));
const Discussions = React.lazy(() =>
  import("../pages/wrappers/DiscussionsPage")
);
const Schedule = React.lazy(() => import("../pages/student/Schedule"));
const AiAssistant = React.lazy(() => import("../pages/student/AiAssistant"));
const Evaluations = React.lazy(() => import("../pages/teacher/Evaluations"));
const Analytics = React.lazy(() => import("../pages/staff/Analytics"));
const Templates = React.lazy(() => import("../pages/staff/Templates"));
const StaffGroups = React.lazy(() => import("../pages/staff/Groups"));
const Users = React.lazy(() => import("../pages/admin/Users"));
const System = React.lazy(() => import("../pages/admin/System"));
const Tracking = React.lazy(() => import("../pages/staff/Tracking"));
const Milestone = React.lazy(() =>
  import("../pages/staff/DeliveryMilestoneManagement/milestone")
);
const Delivery = React.lazy(() =>
  import("../pages/staff/DeliveryMilestoneManagement/delivery")
);
const GroupTracking = React.lazy(() => import("../pages/staff/Tracking/grouptracking"));
const SemesterManagement = React.lazy(() => import("../pages/staff/SemesterManagement"));
const SemesterList = React.lazy(() => import("../pages/staff/SemesterList"));
const SemesterDetail = React.lazy(() => import("../pages/staff/SemesterDetail"));
const DefaultPage = React.lazy(() => import("../pages/common/DefaultPage"));

// Student pages
const StudentMilestones = React.lazy(() => import("../pages/student/Milestones"));
const StudentDeliveries = React.lazy(() => import("../pages/student/Deliveries"));
const StudentTasks = React.lazy(() => import("../pages/student/Tasks"));
const StudentMeetings = React.lazy(() => import("../pages/student/Meetings"));
const StudentMinutes = React.lazy(() => import("../pages/student/Minutes"));
const StudentEvaluation = React.lazy(() => import("../pages/student/Evaluation"));
const StudentDocuments = React.lazy(() => import("../pages/student/Documents"));

// Supervisor pages
const SupervisorGroups = React.lazy(() => import("../pages/supervisor/Groups"));
const SupervisorRoles = React.lazy(() => import("../pages/supervisor/Roles"));
const SupervisorVotes = React.lazy(() => import("../pages/supervisor/Votes"));
const SupervisorMeetings = React.lazy(() => import("../pages/supervisor/Meetings"));
const SupervisorTracking = React.lazy(() => import("../pages/supervisor/Tracking"));
const SupervisorTasks = React.lazy(() => import("../pages/supervisor/Tasks"));
const SupervisorEvaluation = React.lazy(() => import("../pages/supervisor/Evaluation"));
const SupervisorDocuments = React.lazy(() => import("../pages/supervisor/Documents"));
const SupervisorSchedule = React.lazy(() => import("../pages/supervisor/Schedule"));
export const routes = [
  {
    path: "/",
    element: DefaultPage,
    meta: { 
      title: "Trang chủ", 
      protected: true, 
      roles: ["ADMIN", "STAFF", "STUDENT", "SUPERVISOR"] 
    },
  },
  {
    path: "/home",
    element: Home,
    meta: { title: "Home", public: true, layout: "none" },
  },
  {
    path: "/login",
    element: Login,
    meta: { title: "Login", public: true, layout: "none" },
  },
  {
    path: "/dashboard",
    element: Dashboard,
    meta: {
      title: "Dashboard",
      protected: true,
      roles: ["ADMIN", "STAFF", "STUDENT", "SUPERVISOR"],
    },
  },
  {
    path: "/components",
    element: ComponentsDemo,
    meta: {
      title: "Components",
      protected: true,
      roles: ["ADMIN", "STAFF", "STUDENT", "SUPERVISOR"],
    },
  },
  {
    path: "/settings",
    element: Settings,
    meta: { title: "Settings", protected: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/tasks",
    element: Tasks,
    meta: {
      title: "Tasks",
      protected: true,
      roles: ["STAFF", "STUDENT", "SUPERVISOR"],
    },
  },
  {
    path: "/reports",
    element: Reports,
    meta: {
      title: "Reports",
      protected: true,
      roles: ["STAFF", "STUDENT", "SUPERVISOR"],
    },
  },
  {
    path: "/progress",
    element: Progress,
    meta: {
      title: "Progress",
      protected: true,
      roles: ["STAFF", "STUDENT", "SUPERVISOR"],
    },
  },
  {
    path: "/discussions",
    element: Discussions,
    meta: {
      title: "Discussions",
      protected: true,
      roles: ["STUDENT", "SUPERVISOR"],
    },
  },
  {
    path: "/schedule",
    element: Schedule,
    meta: {
      title: "Schedule",
      protected: true,
      roles: ["STUDENT", "SUPERVISOR"],
    },
  },
  {
    path: "/ai",
    element: AiAssistant,
    meta: { title: "AI Assistant", protected: true, roles: ["STUDENT"] },
  },
  {
    path: "/evaluations",
    element: Evaluations,
    meta: { title: "Evaluations", protected: true, roles: ["SUPERVISOR"] },
  },
  {
    path: "/analytics",
    element: Analytics,
    meta: { title: "Analytics", protected: true, roles: ["STAFF"] },
  },
  {
    path: "/staff/groups",
    element: StaffGroups,
    meta: { title: "Capstone Groups", protected: true, roles: ["STAFF"] },
  },
  {
    path: "/templates",
    element: Templates,
    meta: { title: "Templates", protected: true, roles: ["STAFF"] },
  },
  {
    path: "/users",
    element: Users,
    meta: { title: "Users", protected: true, roles: ["ADMIN"] },
  },
  {
    path: "/system",
    element: System,
    meta: { title: "System", protected: true, roles: ["ADMIN"] },
  },
  {
    path: "*",
    element: NotFound,
    meta: { title: "Not Found", public: true },
  },
  {
    path: "/tracking",
    element: Tracking,
    meta: { title: "Tracking", protected: true, roles: ["STAFF"] },
  },
  {
    path: "/staff/tracking/group/:groupId",
    element: GroupTracking,
    meta: { title: "Group Tracking", protected: true, roles: ["STAFF"] },
  },
  {
    path: "/milestones",
    element: Milestone,
    meta: {
      title: "Milestones Management",
      protected: true,
      roles: ["STAFF"],
    },
  },
  {
    path: "/delivery-management",
    element: Delivery,
    meta: {
      title: "Delivery Management",
      protected: true,
      roles: ["STAFF"],
    },
  },
  {
    path: "/category-management/semesters",
    element: SemesterList,
    meta: {
      title: "Danh Sách Kỳ Học",
      protected: true,
      roles: ["STAFF"],
    },
  },
  {
    path: "/category-management/semester/create",
    element: SemesterManagement,
    meta: {
      title: "Tạo Kỳ Học",
      protected: true,
      roles: ["STAFF"],
    },
  },
  {
    path: "/category-management/semester/:id",
    element: SemesterDetail,
    meta: {
      title: "Chi Tiết Kỳ Học",
      protected: true,
      roles: ["STAFF"],
    },
  },
  // Student routes
  {
    path: "/student/milestones",
    element: StudentMilestones,
    meta: {
      title: "Milestones",
      protected: true,
      roles: ["STUDENT"],
    },
  },
  {
    path: "/student/deliveries",
    element: StudentDeliveries,
    meta: {
      title: "Delivery Management",
      protected: true,
      roles: ["STUDENT"],
    },
  },
  {
    path: "/student/tasks",
    element: StudentTasks,
    meta: {
      title: "Task Management",
      protected: true,
      roles: ["STUDENT"],
    },
  },
  {
    path: "/student/meetings",
    element: StudentMeetings,
    meta: {
      title: "Meeting Management",
      protected: true,
      roles: ["STUDENT"],
    },
  },
  {
    path: "/student/minutes",
    element: StudentMinutes,
    meta: {
      title: "Meeting Minutes",
      protected: true,
      roles: ["STUDENT"],
    },
  },
  {
    path: "/student/evaluation",
    element: StudentEvaluation,
    meta: {
      title: "My Evaluation",
      protected: true,
      roles: ["STUDENT"],
    },
  },
  {
    path: "/student/documents",
    element: StudentDocuments,
    meta: {
      title: "Documents",
      protected: true,
      roles: ["STUDENT"],
    },
  },
  // Supervisor routes
  {
    path: "/supervisor/groups",
    element: SupervisorGroups,
    meta: {
      title: "Groups",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
  {
    path: "/supervisor/roles",
    element: SupervisorRoles,
    meta: {
      title: "Role Management",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
  {
    path: "/supervisor/votes",
    element: SupervisorVotes,
    meta: {
      title: "Vote Scheduler",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
  {
    path: "/supervisor/meetings",
    element: SupervisorMeetings,
    meta: {
      title: "Meetings",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
  {
    path: "/supervisor/tracking",
    element: SupervisorTracking,
    meta: {
      title: "Tracking",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
  {
    path: "/supervisor/tasks",
    element: SupervisorTasks,
    meta: {
      title: "Task Management",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
  {
    path: "/supervisor/documents",
    element: SupervisorDocuments,
    meta: {
      title: "Delivery Management",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
  {
    path: "/supervisor/evaluation",
    element: SupervisorEvaluation,
    meta: {
      title: "Evaluation System",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
  {
    path: "/supervisor/schedule",
    element: SupervisorSchedule,
    meta: {
      title: "Schedule Management",
      protected: true,
      roles: ["SUPERVISOR"],
    },
  },
];
