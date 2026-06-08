// dashboard/src/components/inventory/InventorySidebar.jsx

import { NavLink } from 'react-router-dom';

const links = [
  {
    label: 'Master Items',
    path: '/owner/inventory/master-items'
  },
  {
    label: 'Categories',
    path: '/owner/inventory/categories'
  },
  {
    label: 'Vendors',
    path: '/owner/inventory/vendors'
  },
  {
    label: 'Units',
    path: '/owner/inventory/units'
  }
];

export default function InventorySidebar() {
  return (
    <div className="w-64 bg-white rounded-xl border p-4">
      <h2 className="font-semibold text-lg mb-4">
        Inventory
      </h2>

      <div className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'hover:bg-gray-50'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}