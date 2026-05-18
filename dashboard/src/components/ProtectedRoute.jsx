import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({
  children,
  roles = []
}) {
  const { user, outlet, isLoading } =
    useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    roles.length > 0 &&
    !roles.includes(outlet?.role)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}