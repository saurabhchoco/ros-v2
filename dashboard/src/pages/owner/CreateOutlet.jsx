import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getTenantContext } from '../../utils/tenantContext';
import { adminApi } from '../../services/adminApi';

const OUTLET_TYPES = [
  'RESTAURANT',
  'QSR',
  'CAFE',
  'BAKERY',
  'FOOD_COURT',
  'CLOUD_KITCHEN',
  'KIOSK',
  'STREET_FOOD'
];

export default function CreateOutlet() {
  const navigate = useNavigate();
  const outlet = useAuthStore((s) => s.outlet);
  const { organizationId: userOrgId } = getTenantContext(outlet);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [outletType, setOutletType] = useState('RESTAURANT');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userOrgId) {
      setError('Organization ID not found. Please log out and log in again.');
      return;
    }
    setLoading(true);
    setError('');
    const payload = {
      organizationId: userOrgId,
      name: name,
      outletType: outletType
    };
    console.log('Submitting payload:', payload);
    try {
      await adminApi.createOutletAsBrandOwner(payload);
      navigate('/owner');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create outlet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-indigo-500 text-sm font-medium mb-6 flex items-center gap-1 hover:underline"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Outlet</h2>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bandra West Branch"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Type</label>
            <select
              value={outletType}
              onChange={(e) => setOutletType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            >
              {OUTLET_TYPES.map(t => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Outlet'}
          </button>
        </form>
      </div>
    </div>
  );
}