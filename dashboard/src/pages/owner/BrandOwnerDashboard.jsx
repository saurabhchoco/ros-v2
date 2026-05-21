import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';

export default function BrandOwnerDashboard() {
  const navigate = useNavigate();
  const outlet = useAuthStore((s) => s.outlet);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  console.log('Outlet context:', outlet);
  
  // organization_id vs organizationId mismatch
  const orgId = outlet?.organization_id || outlet?.organizationId;
  
  if (!orgId) {
    console.log('No org ID yet');
    setLoading(false);
    return;
  }
  
  const load = async () => {
    try {
      console.log('Fetching outlets for org:', orgId);
      const res = await adminApi.listOutlets(orgId, true);
      console.log('Outlets response:', res.data);
      setOutlets(res.data.data || []);
    } catch (e) {
      console.error('Failed to load outlets:', e);
    } finally {
      setLoading(false);
    }
  };
  
  load();
}, [outlet]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            My Outlets
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {outlets.length} outlet{outlets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/owner/outlets/create')}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition"
        >
          + Add Outlet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {outlets.map((out) => (
          <div
            key={out.id}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition"
          >
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              {out.name}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {out.outlet_type}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  navigate(
                    `/owner/menu?outlet=${out.id}`
                  )
                }
                className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
              >
                Menu
              </button>
              <button
                onClick={() =>
                  navigate(
                    `/owner/managers?outlet=${out.id}`
                  )
                }
                className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition"
              >
                Managers
              </button>
                            <button
                onClick={() =>
                  navigate(
                    `/owner/outlet-analytics?outlet=${out.id}`
                  )
                }
                className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
              >
                Analytics
              </button>
            </div>
          </div>
        ))}
      </div>

      {outlets.length === 0 && (
        <div className="text-center text-gray-400 py-16">
          <p className="mb-4">No outlets yet</p>
          <button
            onClick={() => navigate('/owner/outlets/create')}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600"
          >
            Create Your First Outlet
          </button>
        </div>
      )}
    </div>
  );
}