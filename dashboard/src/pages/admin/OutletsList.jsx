import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';

export default function OutletsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get('brand');

  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadOutlets();
  }, [brandId]);

  const loadOutlets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.outlets.getAll(brandId || null);
      setOutlets(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load outlets');
      console.error('Error loading outlets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOutlets = filterType
    ? outlets.filter(o => o.outlet_type === filterType)
    : outlets;

  const handleDeactivate = async (outletId) => {
    setDeleteConfirm(null);
    try {
      await adminApi.outlets.deactivate(outletId);
      setOutlets(outlets.map(o =>
        o.id === outletId ? { ...o, status: 'INACTIVE' } : o
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate outlet');
      console.error('Error deactivating outlet:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading outlets...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Outlets</h1>
          <p className="text-gray-600 mt-2">
            {brandId ? 'Outlets for selected brand' : 'All outlets'}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/outlets/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          + Create Outlet
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="RESTAURANT">Restaurant</option>
          <option value="CAFE">Cafe</option>
          <option value="CLOUD_KITCHEN">Cloud Kitchen</option>
          <option value="DELIVERY_ONLY">Delivery Only</option>
        </select>
      </div>

      {/* Outlets List */}
      {filteredOutlets.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">🏪</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No outlets found</h3>
          <p className="text-gray-600 mb-6">Create your first outlet to get started</p>
          <button
            onClick={() => navigate('/admin/outlets/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Create Outlet
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOutlets.map((outlet) => (
            <div
              key={outlet.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                {/* Outlet Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{outlet.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        outlet.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {outlet.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">ID: {outlet.id}</p>

                  <div className="grid grid-cols-3 gap-6 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Brand</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {outlet.organization_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {outlet.outlet_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Managers</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {outlet.manager_count || 0}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    Created: {new Date(outlet.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/admin/outlets/${outlet.id}/managers`)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium whitespace-nowrap"
                  >
                    Managers
                  </button>
                  {outlet.status === 'ACTIVE' && (
                    <button
                      onClick={() => setDeleteConfirm(outlet.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium whitespace-nowrap"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Deactivate Outlet?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate this outlet? This action cannot be easily undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeactivate(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}