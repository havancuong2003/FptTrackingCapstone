import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../ui/layout/MainLayout'
import RequireAuth from './RequireAuth'
import LoginPage from '../ui/pages/Login'
import DashboardPage from '../ui/pages/Dashboard'
import TrackingPage from '../ui/pages/Tracking'
import AdminPage from '../ui/pages/Admin'
import DaoTaoPage from '../ui/pages/DaoTao'
import GiangVienPage from '../ui/pages/GiangVien'
import SinhVienPage from '../ui/pages/SinhVien'
import NotFoundPage from '../ui/pages/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      {
        path: 'tracking',
        element: (
          <RequireAuth requiredPermissions={["tracking.view"]}>
            <TrackingPage />
          </RequireAuth>
        ),
      },
      { path: 'admin', element: <AdminPage /> },
      { path: 'dao-tao', element: <DaoTaoPage /> },
      { path: 'giang-vien', element: <GiangVienPage /> },
      { path: 'sinh-vien', element: <SinhVienPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '*', element: <NotFoundPage /> },
]) 