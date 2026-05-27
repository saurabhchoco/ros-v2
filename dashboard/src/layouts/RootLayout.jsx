import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import StartShiftButton from '../components/StartShiftButton';
import NotificationListener from '../components/NotificationListener';
import { apiService } from '../services/api';

export default function RootLayout() {
  const { user, outlet, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingShift, setCheckingShift] = useState(true);
  const [activeShift, setActiveShift] = useState(null);

  // Define shift roles
  const shiftRoles = ['CAPTAIN', 'GSA', 'CASHIER', 'KITCHEN'];

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    navigate('/login');
  };

  const role = outlet?.role;

  const navItems = [
    // Kitchen ONLY → KDS Board
    ...(role === 'KITCHEN' ? [{ path: '/kds', label: 'KDS Board' }] : []),
    // CASHIER only
    ...(role === 'CASHIER' ? [{ path: '/orders', label: 'Orders' }] : []),
    // GSA only
    ...(role === 'GSA' ? [{ path: '/orders', label: 'Orders' }, { path: '/captain', label: 'Captain' }] : []),
    // ARM (Assistant Restaurant Manager)
    ...(role === 'ARM' ? [
      { path: '/kds', label: 'KDS Board' },
      { path: '/orders', label: 'Orders' },
      { path: '/reports', label: 'Reports' },
      { path: '/captain', label: 'Captain' }
    ] : []),
    // Outlet Manager → KDS, Orders, Reports, Captain
    ...(role === 'OUTLET_MANAGER' ? [
      { path: '/kds', label: 'KDS Board' },
      { path: '/orders', label: 'Orders' },
      { path: '/reports', label: 'Reports' },
      { path: '/captain', label: 'Captain' }
    ] : []),
    // Captain ONLY → Captain screen
    ...(role === 'CAPTAIN' ? [{ path: '/captain', label: 'Captain' }] : []),
    // Super Admin
    ...(role === 'SUPER_ADMIN' ? [{ path: '/admin', label: '⚙️ Admin' }] : []),
    // Brand Owner
    ...(role === 'BRAND_OWNER' ? [
      { path: '/owner', label: '🏪 My Outlets' },
      { path: '/owner/analytics', label: '📊 Analytics' }
    ] : [])
  ];

useEffect(() => {
  const check = async () => {
    try {
      const res = await apiService.getActiveShift();
      setActiveShift(res.data.activeShift);
    } catch (err) { console.error(err); }
    finally { setCheckingShift(false); }
  };
  if (outlet && shiftRoles.includes(outlet.role)) check();
  else setCheckingShift(false);
}, [user, outlet]);

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
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {outlet && (
            <span className="text-white/80 text-sm hidden md:block">
              {outlet?.outletName || outlet?.name || 'My Outlet'}
            </span>
          )}
          {!checkingShift && <StartShiftButton />}
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-white/10 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all border border-white/20"
          >
            Logout
          </button>

          {/* Show banner only when shift has ended for eligible roles */}
          {!checkingShift && !activeShift && outlet && shiftRoles.includes(outlet.role) && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm font-medium">
              You are not on shift. Please start your shift to take orders.
            </div>
          )}
        </div>
      </header>

      <NotificationListener />

      {/* Page Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}