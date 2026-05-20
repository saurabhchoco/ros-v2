import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import LoginPage from '../pages/LoginPage';
import KDSScreen from '../pages/KDSScreen';
import OrdersList from '../pages/OrdersList';
import Reports from '../pages/Reports';
import Captain from '../pages/Captain';
import ErrorPage from '../pages/ErrorPage';

import AdminDashboard from '../pages/admin/AdminDashboard';
import CreateBrand from '../pages/admin/CreateBrand';
import CreateOutlet from '../pages/admin/CreateOutlet';
import CreateManager from '../pages/admin/CreateManager';
import ProtectedRoute from '../components/ProtectedRoute';

import OutletsList from '../pages/admin/OutletsList';

import BrandOwnerDashboard from '../pages/owner/BrandOwnerDashboard';
import CreateOwnerOutlet from '../pages/owner/CreateOutlet';
import MenuManagement from '../pages/owner/MenuManagement';
import AssignManagers from '../pages/owner/AssignManagers';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <KDSScreen /> },
      { path: 'kds', element: <KDSScreen /> },
      { path: 'orders', element: <OrdersList /> },
      { path: 'reports', element: <Reports /> },
      {
        path: 'captain',
        element: (
          <ProtectedRoute roles={['CAPTAIN', 'OUTLET_MANAGER']}>
            <Captain />
          </ProtectedRoute>
        )
      },

       // Admin routes — SUPER_ADMIN only
      {
        path: 'admin',
        element: (
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/brands/create',
        element: (
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <CreateBrand />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/outlets/create',
        element: (
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <CreateOutlet />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/outlets',
        element: (
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <OutletsList />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/managers/create',
        element: (
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <CreateManager />
          </ProtectedRoute>
        )
      },
      {
        path: 'owner',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER']}>
            <BrandOwnerDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'owner/outlets/create',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER']}>
            <CreateOwnerOutlet />
          </ProtectedRoute>
        )
      },
      {
        path: 'owner/menu',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER']}>
            <MenuManagement />
          </ProtectedRoute>
        )
      },
      {
        path: 'owner/managers',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER']}>
            <AssignManagers />
          </ProtectedRoute>
        )
      },
      {
        path: 'owner/managers/create',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER']}>
            <CreateManager />
          </ProtectedRoute>
        )
      },
    ]
  }
]);
