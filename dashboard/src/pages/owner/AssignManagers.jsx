import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api'; // use your main api service

export default function AssignManagers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const outletId = searchParams.get('outlet');
  const outlet = useAuthStore((s) => s.outlet);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!outletId) return;
    const fetchStaff = async () => {
      try {
        // Use the new endpoint (adjust path as needed)
        const res = await apiService.getOutletUsers(outletId);
        setStaff(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch staff', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [outletId]);

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/owner')}
        className="text-indigo-500 text-sm font-medium mb-6 hover:underline"
      >
        ← Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Outlet Staff – {outlet?.outletName || outlet?.name || 'Outlet'}
        </h2>
        <button
          onClick={() =>
            navigate(`/owner/managers/create?org=${outlet?.organization_id}&outlet=${outletId}`)
          }
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600"
        >
          + Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Role</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((user) => (
              <tr key={user.id} className="border-b border-gray-50">
                <td className="p-4 font-medium text-gray-800">{user.full_name}</td>
                <td className="p-4 text-gray-600">{user.email}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staff.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No staff assigned to this outlet
          </div>
        )}
      </div>
    </div>
  );
}