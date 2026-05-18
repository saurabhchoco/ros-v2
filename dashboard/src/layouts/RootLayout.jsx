import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function RootLayout() {
  const { user, outlet, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <nav className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">R-OS</h1>
        
        <div className="space-y-2 flex-1">
          <NavLink to="/kds">🍳 Kitchen Display</NavLink>
          <NavLink to="/orders">📦 Orders</NavLink>
          <NavLink to="/reports">📊 Reports</NavLink>
          <NavLink to="/captain">👨‍💼 Captain</NavLink>
        </div>

        <div className="pt-8 border-t border-gray-700">
          {outlet && (
            <>
              <p className="text-sm text-gray-300 font-medium mb-1">
                {outlet.outletName || 'My Outlet'}
              </p>
              <p className="text-xs text-gray-400 mb-4 truncate">
                {user?.email}
              </p>
            </>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, children }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        window.location.hash = to;
        window.location.href = to;
      }}
      className="block w-full text-left px-4 py-3 rounded transition text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white"
    >
      {children}
    </a>
  );
}
