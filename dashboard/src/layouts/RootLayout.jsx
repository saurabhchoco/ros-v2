import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function RootLayout() {
  const { user, outlet, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    navigate('/login');
  };

const role = outlet?.role;

const navItems = [
  { path: '/kds', label: 'KDS Board' },
  { path: '/orders', label: 'Orders' },
  { path: '/reports', label: 'Reports' },
  ...(role === 'OUTLET_MANAGER' || role === 'KITCHEN' 
    ? [{ path: '/captain', label: 'Captain' }] 
    : []),
  ...(role === 'SUPER_ADMIN' ? [{ path: '/admin', label: '⚙️ Admin' }] : []),
  ...(role === 'BRAND_OWNER' ? [{ path: '/owner', label: '🏪 My Outlets' }] : []),
];

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/kds' && location.pathname === '/');

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
        <h1 className="text-white text-2xl font-bold tracking-tight">
          R-OS
        </h1>

        <div className="flex items-center gap-2">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive(item.path)
                  ? 'bg-white text-indigo-600 shadow'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {outlet && (
            <span className="text-white/80 text-sm hidden md:block">
            {outlet.name || 'My Outlet'}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-white/10 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all border border-white/20"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

    </div>
  );
}