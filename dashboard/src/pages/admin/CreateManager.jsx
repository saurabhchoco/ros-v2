import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';

export default function CreateManager() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOrg = searchParams.get('org') || '';
  const preselectedOutlet = searchParams.get('outlet') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outletName, setOutletName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [form, setForm] = useState({
    organizationId: preselectedOrg,
    outletId: preselectedOutlet,
    fullName: '',
    email: '',
    password: ''
  });

  // Fetch brand and outlet names for display
  useEffect(() => {
    if (preselectedOrg) {
      adminApi.listBrands()
        .then(res => {
          const brand = res.data.data?.find(b => b.id === preselectedOrg);
          if (brand) setBrandName(brand.name);
        })
        .catch(console.error);
    }
    if (preselectedOutlet && preselectedOrg) {
      adminApi.listOutlets(preselectedOrg)
        .then(res => {
          const outlet = res.data.data?.find(o => o.id === preselectedOutlet);
          if (outlet) setOutletName(outlet.name);
        })
        .catch(console.error);
    }
  }, [preselectedOrg, preselectedOutlet]);

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.createOutletManager(form);
      // Navigate back to outlet list
      navigate(`/admin/outlets?org=${preselectedOrg}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create manager');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-indigo-500 text-sm font-medium mb-6">
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Outlet Manager</h2>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden fields to prevent autofill */}
          <input type="email" style={{ display: 'none' }} />
          <input type="password" style={{ display: 'none' }} />

          {/* Brand - show as label when preselected */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              {brandName || 'Loading...'}
            </div>
          </div>

          {/* Outlet - show as label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              {outletName || 'Loading...'}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-600">Manager Account</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="manager@outlet.com"
                required
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
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