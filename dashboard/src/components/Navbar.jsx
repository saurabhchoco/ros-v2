import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-8">
        <h1
          onClick={() => navigate('/')}
          className="text-xl font-bold cursor-pointer hover:text-gray-300"
        >
          ROS Dashboard
        </h1>

        <div className="flex gap-4">
          {/* Standard navigation */}
          <button
            onClick={() => navigate('/orders')}
            className="hover:bg-gray-700 px-3 py-2 rounded transition"
          >
            Orders
          </button>
          <button
            onClick={() => navigate('/captain')}
            className="hover:bg-gray-700 px-3 py-2 rounded transition"
          >
            Captain
          </button>
          <button
            onClick={() => navigate('/kds')}
            className="hover:bg-gray-700 px-3 py-2 rounded transition"
          >
            KDS
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="hover:bg-gray-700 px-3 py-2 rounded transition"
          >
            Reports
          </button>

          {/* Admin-only navigation */}
          {isAdmin && (
            <>
              <div className="border-l border-gray-700 mx-2"></div>
              <button
                onClick={() => navigate('/admin')}
                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition font-semibold"
              >
                Admin Panel
              </button>
            </>
          )}
        </div>
      </div>

      {/* User menu */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm text-gray-400">Logged in as</p>
          <p className="font-semibold flex items-center gap-2">
            {user?.email}
            {isAdmin && (
              <span className="bg-red-600 text-xs px-2 py-1 rounded">
                ADMIN
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}