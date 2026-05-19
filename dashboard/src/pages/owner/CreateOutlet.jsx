import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';

const OUTLET_TYPES = [
  'RESTAURANT',
  'QSR',
  'CAFE',
  'BAKERY',
];

export default function CreateOutlet() {
  const navigate = useNavigate();
  const outlet = useAuthStore((s) => s.outlet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    organizationId: outlet?.organization_id || '',
    name: '',
    outletType: 'RESTAURANT'
  });

  const set = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminApi.createOutletAsBrandOwner(form);
      navigate('/owner');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create outlet'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button
        onClick={() => navigate('/owner')}
        className="text-indigo-500 text-sm font-medium mb-6 hover:underline"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Create Outlet
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outlet Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Downtown Branch"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={form.outletType}
              onChange={set('outletType')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            >
              {OUTLET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
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