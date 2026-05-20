import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const { outlet, isLoading } = useAuthStore();
  const role = outlet?.role;

  useEffect(() => {
    if (isLoading) return;
    if (!role) {
      navigate('/login');
      return;
    }
    switch (role) {
      case 'SUPER_ADMIN':
        navigate('/admin');
        break;
      case 'BRAND_OWNER':
        navigate('/owner');
        break;
      case 'OUTLET_MANAGER':
      case 'KITCHEN':
        navigate('/kds');
        break;
      case 'CAPTAIN':
        navigate('/captain');
        break;
      default:
        navigate('/kds');
    }
  }, [role, isLoading, navigate]);

  return <div className="flex items-center justify-center h-screen">Loading...</div>;
}