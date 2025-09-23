import React from 'react';

const RedirectToLogin = React.lazy(() => import('../pages/RedirectToLogin'));
const Home = React.lazy(() => import('../pages/Home'));
const Login = React.lazy(() => import('../pages/Login'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Settings = React.lazy(() => import('../pages/Settings'));
const ComponentsDemo = React.lazy(() => import('../pages/ComponentsDemo'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

export const routes = [
  {
    path: '/',
    element: RedirectToLogin,
    meta: { title: 'Login', public: true, layout: 'none' },
  },
  {
    path: '/home',
    element: Home,
    meta: { title: 'Home', public: true, layout: 'none' },
  },
  {
    path: '/login',
    element: Login,
    meta: { title: 'Login', public: true, layout: 'none' },
  },
  {
    path: '/dashboard',
    element: Dashboard,
    meta: { title: 'Dashboard', protected: true, roles: ['ADMIN', 'STAFF', 'STUDENT', 'TEACHER'] },
  },
  {
    path: '/components',
    element: ComponentsDemo,
    meta: { title: 'Components', protected: true, roles: ['ADMIN', 'STAFF', 'STUDENT', 'TEACHER'] },
  },
  {
    path: '/settings',
    element: Settings,
    meta: { title: 'Settings', protected: true, roles: ['ADMIN', 'STAFF'] },
  },
  {
    path: '*',
    element: NotFound,
    meta: { title: 'Not Found', public: true },
  },
]; 