import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const { outlet, isLoading } = useAuthStore();
  const role = outlet?.role;   // ✅ stable primitive

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
      case 'ARM':
      case 'KITCHEN':
        navigate('/kds');
        break;
      case 'CAPTAIN':
      case 'GSA':          // GSA can also take orders
        navigate('/captain');
        break;
      case 'CASHIER':
        navigate('/orders');
        break;
      case 'VENDOR':
        // Vendor has its own entry point; you may redirect to vendor page or keep as is
        navigate('/vendor');
        break;
      default:
        navigate('/kds');
    }
  }, [role, isLoading, navigate]); // ✅ stable dependencies (role and isLoading are primitives)
  // navigate is stable from useNavigate

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-400">Loading...</div>
    </div>
  );
}