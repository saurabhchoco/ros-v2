import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const menuItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Brands', path: '/admin/brands' },
    { label: 'Outlets', path: '/admin/outlets' },
    { label: 'Users', path: '/admin/users' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full text-left px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">Logged in as:</p>
          <p className="text-sm font-semibold">{user?.email}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}