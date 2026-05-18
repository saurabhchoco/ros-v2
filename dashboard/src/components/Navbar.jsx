import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <h1 className="text-3xl font-bold text-white">
          R-OS
        </h1>

        <nav className="flex items-center gap-4">

          <NavLink
            to="/kds"
            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg transition"
          >
            KDS Board
          </NavLink>

          <NavLink
            to="/orders"
            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg transition"
          >
            Orders
          </NavLink>

          <NavLink
            to="/reports"
            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg transition"
          >
            Reports
          </NavLink>

          <NavLink
            to="/captain"
            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg transition"
          >
            Captain
          </NavLink>

          <button
            onClick={logout}
            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}