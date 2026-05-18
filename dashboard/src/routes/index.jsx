import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import LoginPage from '../pages/LoginPage';
import KDSScreen from '../pages/KDSScreen';
import OrdersList from '../pages/OrdersList';
import Reports from '../pages/Reports';
import Captain from '../pages/Captain';
import ErrorPage from '../pages/ErrorPage';

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
      { path: 'captain', element: <Captain /> }
    ]
  }
]);
