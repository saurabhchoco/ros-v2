import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';

export default function AssignManagers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outletId = searchParams.get('outlet');
  const outlet = useAuthStore((s) => s.outlet);

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orgId = outlet?.organization_id || outlet?.organizationId;
    if (!outletId || !orgId) return;
    adminApi
      .listUsers(outlet.orgId)
      .then((res) => {
        const mgrs = (res.data.data || []).filter(
          (u) => u.role === 'OUTLET_MANAGER'
        );
        setManagers(mgrs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [outlet]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={() => navigate('/owner')}
        className="text-indigo-500 text-sm font-medium mb-6 hover:underline"
      >
        ← Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Outlet Managers
        </h2>
        <button
            onClick={() =>
                navigate(
                `/owner/managers/create?org=${outlet?.organizationId}&outlet=${outletId}`
                )
            }
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600"
            >
            + Add Manager
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Name
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Email
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Outlet
              </th>
            </tr>
          </thead>
          <tbody>
            {managers.map((mgr) => (
              <tr
                key={mgr.id}
                className="border-b border-gray-50"
              >
                <td className="p-4 font-medium text-gray-800">
                  {mgr.full_name}
                </td>
                <td className="p-4 text-gray-600">
                  {mgr.email}
                </td>
                <td className="p-4 text-gray-600">
                  {mgr.outlet_name || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {managers.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No managers assigned
          </div>
        )}
      </div>
    </div>
  );
}