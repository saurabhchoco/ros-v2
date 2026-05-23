import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import Badge from '../../components/ui/Badge';

export default function OutletsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('org');

  const [outlets, setOutlets] = useState([]);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      navigate('/admin');
      return;
    }

    const load = async () => {
      try {
        const res = await adminApi.listOutlets(orgId);
        const data = res.data.data || [];
        setOutlets(data);
        if (data.length > 0) {
          setBrand(data[0].organization_name);
        }
      } catch (e) {
        console.error('Failed to load outlets', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/admin')}
        className="text-indigo-500 text-sm font-medium mb-6 flex items-center gap-1 hover:underline"
      >
        ← Back to Admin
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Outlets — {brand}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {outlets.length} outlet{outlets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate(`/admin/outlets/create?org=${orgId}`)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition"
        >
          + Add Outlet
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Outlet</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Type</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Managers</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {outlets.map(outlet => (
              <tr key={outlet.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="p-4">
                  <p className="font-semibold text-gray-800">{outlet.name}</p>
                </td>
                <td className="p-4 text-gray-700">
                  {outlet.outlet_type.replace('_', ' ')}
                </td>
                <td className="p-4 text-gray-700">
                  {outlet.manager_count}
                </td>
                <td className="p-4">
                  <Badge variant={outlet.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {outlet.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <button
                    onClick={() =>
                      navigate(`/admin/managers/create?org=${orgId}&outlet=${outlet.id}`)
                    }
                    className="text-indigo-500 text-sm font-medium hover:underline"
                  >
                    + Manager
                  </button>
                  <button
                    onClick={() => navigate(`/admin/menu?outlet=${outlet.id}&org=${outlet.organization_id}`)}
                    className="text-green-500 text-sm font-medium hover:underline ml-3"
                  >
                    Menu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {outlets.map(outlet => (
          <div key={outlet.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 text-lg">{outlet.name}</h3>
              <Badge variant={outlet.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {outlet.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">Type: {outlet.outlet_type.replace('_', ' ')}</p>
            <p className="text-sm text-gray-500">Managers: {outlet.manager_count}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigate(`/admin/managers/create?org=${orgId}&outlet=${outlet.id}`)}
                className="px-3 py-1.5 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition"
              >
                + Manager
              </button>
              <button
                onClick={() => navigate(`/admin/menu?outlet=${outlet.id}&org=${outlet.organization_id}`)}
                className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition"
              >
                Menu
              </button>
            </div>
          </div>
        ))}
      </div>

      {outlets.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No outlets yet. Create one to get started.
        </div>
      )}
    </div>
  );
}