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

import DashboardRedirect from '../components/DashboardRedirect';

import BrandAnalytics from '../pages/owner/BrandAnalytics';
import OutletAnalytics from '../pages/owner/OutletAnalytics';

import PublicOrder from '../pages/PublicOrder';
import VendorScreen from '../pages/VendorScreen';

import InventoryList from '../pages/InventoryList';

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
      { index: true, element: <DashboardRedirect /> },
      // Public routes (no layout)
      { path: 'order/:outletId', element: <PublicOrder /> },
      { path: 'vendor/:outletId', element: <VendorScreen /> },
      {
        path: 'kds',
        element: (
          <ProtectedRoute roles={['OUTLET_MANAGER', 'KITCHEN']}>
            <KDSScreen />
          </ProtectedRoute>
        )
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute roles={['OUTLET_MANAGER', 'KITCHEN', 'BRAND_OWNER']}>
            <OrdersList />
          </ProtectedRoute>
        )
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute roles={['OUTLET_MANAGER', 'KITCHEN', 'BRAND_OWNER']}>
            <Reports />
          </ProtectedRoute>
        )
      },
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
        path: 'admin/menu',
        element: (
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <MenuManagement />
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
      {
        path: 'owner/analytics',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER']}>
            <BrandAnalytics />
          </ProtectedRoute>
        )
      },
      {
        path: 'owner/outlet-analytics',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER']}>
            <OutletAnalytics />
          </ProtectedRoute>
        )
      },

      // Inside the protected routes section (for BRAND_OWNER and OUTLET_MANAGER)
      {
        path: 'inventory',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER', 'OUTLET_MANAGER']}>
            <InventoryList />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
