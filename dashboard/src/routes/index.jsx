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
        path: 'admin/managers/create',
        element: (
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <CreateManager />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
