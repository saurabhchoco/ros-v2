import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';

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
        const res =
          await adminApi.listOutlets(orgId);
        const data = res.data.data || [];
        setOutlets(data);
        if (data.length > 0) {
          setBrand(data[0].organization_name);
        }
      } catch (e) {
        console.error(
          'Failed to load outlets', e
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">
          Loading...
        </div>
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
          <h2 className="text-2xl font-bold text-gray-800">
            Outlets — {brand}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {outlets.length} outlet{outlets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() =>
            navigate(
              `/admin/outlets/create?org=${orgId}`
            )
          }
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition"
        >
          + Add Outlet
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Outlet
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Type
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Managers
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {outlets.map(outlet => (
              <tr
                key={outlet.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition"
              >
                <td className="p-4">
                  <p className="font-semibold text-gray-800">
                    {outlet.name}
                  </p>
                </td>
                <td className="p-4 text-gray-700">
                  {outlet.outlet_type
                    .replace('_', ' ')}
                </td>
                <td className="p-4 text-gray-700">
                  {outlet.manager_count}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    outlet.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {outlet.status}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/managers/create?org=${orgId}&outlet=${outlet.id}`
                      )
                    }
                    className="text-indigo-500 text-sm font-medium hover:underline"
                  >
                    + Manager
                  </button>

                  <button
                    onClick={() => navigate(`/admin/menu?outlet=${outlet.id}&org=${outlet.organization_id}`)}
                    className="text-green-500 text-sm font-medium hover:underline"
                  >
                    Menu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {outlets.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No outlets yet. Create one to get started.
          </div>
        )}
      </div>

    </div>
  );
}