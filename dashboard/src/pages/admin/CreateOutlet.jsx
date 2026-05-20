import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const preselectedOrg = searchParams.get('org') || '';

  const [brands, setBrands] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    organizationId: preselectedOrg,
    name: '',
    outletType: 'RESTAURANT'
  });

  // Fetch brands only when no org preselected
  useEffect(() => {
    if (!preselectedOrg) {
      adminApi.listBrands()
        .then(res => setBrands(res.data.data || []))
        .catch(console.error);
    } else {
      // Fetch brand name for display
      adminApi.listBrands()
        .then(res => {
          const brand = res.data.data?.find(b => b.id === preselectedOrg);
          if (brand) setBrandName(brand.name);
        })
        .catch(console.error);
    }
  }, [preselectedOrg]);

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.createOutletAsBrandOwner(form);
      navigate(preselectedOrg ? `/admin/outlets?org=${preselectedOrg}` : '/admin');
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
          {/* Brand dropdown - only when no org preselected */}
          {!preselectedOrg && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                value={form.organizationId}
                onChange={set('organizationId')}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="">Select brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show brand name when preselected */}
          {preselectedOrg && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                {brandName || 'Loading...'}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Bandra West Branch"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Type</label>
            <select
              value={form.outletType}
              onChange={set('outletType')}
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