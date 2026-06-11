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
import DashboardRedirect from '../components/DashboardRedirect';
import BrandAnalytics from '../pages/owner/BrandAnalytics';
import OutletAnalytics from '../pages/owner/OutletAnalytics';
import PublicOrder from '../pages/PublicOrder';
import VendorScreen from '../pages/VendorScreen';
import InventoryList from '../pages/InventoryList';
import ShiftHandover from '../pages/ShiftHandover';
import OutletStaff from '../pages/owner/OutletStaff';
import NotFoundPage from '../pages/NotFoundPage';
import AccessDeniedPage from '../pages/AccessDeniedPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/access-denied',
    element: <AccessDeniedPage />
  },
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <DashboardRedirect /> },
      // Public routes
      { path: 'order/:outletId', element: <PublicOrder /> },
      { path: 'vendor/:outletId', element: <VendorScreen /> },
      {
        path: 'kds',
        element: (
          <ProtectedRoute roles={['OUTLET_MANAGER', 'KITCHEN', 'ARM', 'CAPTAIN']}>
            <KDSScreen />
          </ProtectedRoute>
        )
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute roles={['OUTLET_MANAGER', 'ARM', 'CAPTAIN', 'CASHIER']}>
            <OrdersList />
          </ProtectedRoute>
        )
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute roles={['OUTLET_MANAGER', 'ARM']}>
            <Reports />
          </ProtectedRoute>
        )
      },
      {
        path: 'captain',
        element: (
          <ProtectedRoute roles={['CAPTAIN', 'OUTLET_MANAGER', 'GSA', 'ARM']}>
            <Captain />
          </ProtectedRoute>
        )
      },
      // Admin routes
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
          <ProtectedRoute roles={['BRAND_OWNER', 'OUTLET_MANAGER']}>
            <MenuManagement />
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
      {
        path: 'inventory',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER', 'OUTLET_MANAGER']}>
            <InventoryList />
          </ProtectedRoute>
        )
      },
      {
        path: 'shift-handover',
        element: (
          <ProtectedRoute roles={['OUTLET_MANAGER', 'ARM', 'CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN']}>
            <ShiftHandover />
          </ProtectedRoute>
        )
      },
      {
        path: 'owner/managers',
        element: (
          <ProtectedRoute roles={['BRAND_OWNER']}>
            <OutletStaff />
          </ProtectedRoute>
        )
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
]);