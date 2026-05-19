import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useAuthStore } from '../../store/authStore';

export default function CreateManager() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOrg = searchParams.get('org') || '';
  const preselectedOutlet = searchParams.get('outlet') || '';

  const outlet = useAuthStore((s) => s.outlet);
  const [brands, setBrands] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    organizationId: preselectedOrg,
    outletId: preselectedOutlet,
    fullName: '',
    email: '',
    password: ''
  });

  // useEffect(() => {
  //   adminApi.listBrands()
  //     .then(res => setBrands(res.data.data || []))
  //     .catch(console.error);
  // }, []);

  useEffect(() => {

    const orgId =
      outlet?.organization_id ||
      outlet?.organizationId;

    if (!orgId) return;

    setBrands([
      {
        id: orgId,
        name:
          outlet?.organization_name ||
          'My Brand'
      }
    ]);

    setForm(prev => ({
      ...prev,
      organizationId: orgId
    }));

  }, [outlet]);

  useEffect(() => {
    if (!form.organizationId) return;
    // adminApi.listOutlets(form.organizationId)
    adminApi.listOutlets(null, true)
      .then(res => setOutlets(res.data.data || []))
      .catch(console.error);
  }, [form.organizationId]);

  const set = (field) => (e) =>
    setForm(prev => ({
      ...prev,
      [field]: e.target.value
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.createOutletManager(form);
      navigate('/owner');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create manager'
      );
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

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Add Outlet Manager
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outlet
            </label>
            <select
              value={form.outletId}
              onChange={set('outletId')}
              required
              disabled={!form.organizationId}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 disabled:opacity-50"
            >
              <option value="">Select outlet</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-600">
              Manager Account
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Full name"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="manager@outlet.com"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temporary Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min 8 characters"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
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
            {loading ? 'Creating...' : 'Create Manager Account'}
          </button>

        </form>
      </div>
    </div>
  );
}