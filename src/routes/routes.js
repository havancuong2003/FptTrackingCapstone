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
export const routes = [
  {
    path: "/",
    element: RedirectToLogin,
    meta: { title: "Login", public: true, layout: "none" },
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
      roles: ["ADMIN", "STAFF", "STUDENT", "TEACHER"],
    },
  },
  {
    path: "/components",
    element: ComponentsDemo,
    meta: {
      title: "Components",
      protected: true,
      roles: ["ADMIN", "STAFF", "STUDENT", "TEACHER"],
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
      roles: ["STAFF", "STUDENT", "TEACHER"],
    },
  },
  {
    path: "/reports",
    element: Reports,
    meta: {
      title: "Reports",
      protected: true,
      roles: ["STAFF", "STUDENT", "TEACHER"],
    },
  },
  {
    path: "/progress",
    element: Progress,
    meta: {
      title: "Progress",
      protected: true,
      roles: ["STAFF", "STUDENT", "TEACHER"],
    },
  },
  {
    path: "/discussions",
    element: Discussions,
    meta: {
      title: "Discussions",
      protected: true,
      roles: ["STUDENT", "TEACHER"],
    },
  },
  {
    path: "/schedule",
    element: Schedule,
    meta: {
      title: "Schedule",
      protected: true,
      roles: ["STUDENT", "TEACHER"],
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
    meta: { title: "Evaluations", protected: true, roles: ["TEACHER"] },
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
    path: "/milestones-management",
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
];
