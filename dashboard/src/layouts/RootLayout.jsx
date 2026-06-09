import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import StartShiftButton from '../components/StartShiftButton';
import NotificationListener from '../components/NotificationListener';
import { apiService } from '../services/api';

import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  BarChart3,
  UserRound,
  Store,
  LogOut,
  Settings,
  Menu
} from 'lucide-react';

import { AppShellNav } from '../components/ui/AppShellNav';

export default function RootLayout() {
  const { user, outlet, logout, setUser } = useAuthStore();
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
    ...(role === 'KITCHEN'
      ? [
        {
          path: '/kds',
          label: 'Kitchen',
          icon: ChefHat
        }
      ]
      : []),

    ...(role === 'CASHIER'
      ? [
        {
          path: '/orders',
          label: 'Orders',
          icon: ClipboardList
        },
        {
          path: '/captain',
          label: 'Captain',
          icon: UserRound
        }
      ]
      : []),

    ...(role === 'GSA'
      ? [
        {
          path: '/orders',
          label: 'Orders',
          icon: ClipboardList
        },
        {
          path: '/captain',
          label: 'Captain',
          icon: UserRound
        }
      ]
      : []),

    ...(role === 'ARM'
      ? [
        {
          path: '/kds',
          label: 'Kitchen',
          icon: ChefHat
        },
        {
          path: '/orders',
          label: 'Orders',
          icon: ClipboardList
        },
        {
          path: '/reports',
          label: 'Reports',
          icon: BarChart3
        },
        {
          path: '/captain',
          label: 'Captain',
          icon: UserRound
        },
        { path: '/owner/menu', label: 'Menu', icon: Menu }
      ]
      : []),

    ...(role === 'OUTLET_MANAGER'
      ? [
        {
          path: '/kds',
          label: 'Kitchen',
          icon: ChefHat
        },
        {
          path: '/orders',
          label: 'Orders',
          icon: ClipboardList
        },
        {
          path: '/reports',
          label: 'Reports',
          icon: BarChart3
        },
        {
          path: '/captain',
          label: 'Captain',
          icon: UserRound
        },
        { path: '/owner/menu', label: 'Menu', icon: Menu }
      ]
      : []),

    ...(role === 'CAPTAIN'
      ? [
        {
          path: '/captain',
          label: 'Captain',
          icon: UserRound
        }
      ]
      : []),

    ...(role === 'SUPER_ADMIN'
      ? [
        {
          path: '/admin',
          label: 'Admin',
          icon: Settings
        }
      ]
      : []),

    ...(role === 'BRAND_OWNER'
      ? [
        {
          path: '/owner',
          label: 'Outlets',
          icon: Store
        },
        {
          path: '/owner/analytics',
          label: 'Analytics',
          icon: BarChart3
        }
      ]
      : [])
  ];

  // ✅ FIX: Ensure user profile is loaded (for BRAND_OWNER after refresh)
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Already have user data in store
      if (user?.role) return;
      // No Firebase user – wait for auth to initialize
      if (!auth.currentUser) return;

      try {
        const res = await apiService.getMe();
        const userData = res.data.data;
        setUser(userData);
        console.log('User profile loaded:', userData);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };
    fetchUserProfile();
  }, [user, setUser]);

  // Shift check effect (unchanged)
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
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        {/* LEFT */}
        <div className="flex items-center gap-10">
          <div>
            <h1 className="text-xl font-bold text-slate-900">R-OS</h1>
            <p className="text-xs text-slate-500">Restaurant Operations Platform</p>
          </div>
          <AppShellNav items={navItems} activePath={location.pathname} onNavigate={navigate} />
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          {user?.role === 'BRAND_OWNER' ? (
            <div className="hidden lg:flex flex-col bg-slate-100 rounded-xl px-4 py-2">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">Brand</span>
              <span className="font-semibold text-slate-900 text-sm">
                {user?.organizationName || 'My Brand'}
              </span>
            </div>
          ) : outlet ? (
            <div className="hidden lg:flex flex-col bg-slate-100 rounded-xl px-4 py-2">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">Outlet</span>
              <span className="font-semibold text-slate-900 text-sm">
                {outlet?.outletName || outlet?.name || 'My Outlet'}
              </span>
            </div>
          ) : null}

          {!checkingShift && <StartShiftButton initialActiveShift={activeShift} />}

          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <NotificationListener />

      {/* Page Content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}