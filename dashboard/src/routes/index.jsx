import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/LoginPage';
import KDSScreen from '../pages/KDSScreen';
import OrdersList from '../pages/OrdersList';
import Reports from '../pages/Reports';
import Captain from '../pages/Captain';
import ErrorPage from '../pages/ErrorPage';

import AdminDashboard from '../pages/admin/AdminDashboard';
import BrandsList from '../pages/admin/BrandsList';
import CreateBrand from '../pages/admin/CreateBrand';
import OutletsList from '../pages/admin/OutletsList';
import CreateOutlet from '../pages/admin/CreateOutlet';
import CreateManager from '../pages/admin/CreateManager';
import UsersList from '../pages/admin/UsersList';
import ProtectedRoute from '../components/ProtectedRoute';

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
      { path: 'captain', element: <Captain /> },

      // ── ADMIN ROUTES ──────────────────────
      {
        path: 'admin',
        element: (
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'brands', element: <BrandsList /> },
          { path: 'brands/create', element: <CreateBrand /> },
          { path: 'outlets', element: <OutletsList /> },
          { path: 'outlets/create', element: <CreateOutlet /> },
          { path: 'managers/create', element: <CreateManager /> },
          { path: 'users', element: <UsersList /> },
        ]
      }
    ]
  }
]);