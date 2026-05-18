import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';

export default function BrandsList() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.brands.getAll();
      setBrands(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load brands');
      console.error('Error loading brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (brandId, brandName) => {
    setDeleteConfirm(null);
    try {
      await adminApi.brands.deactivate(brandId);
      setBrands(brands.map(b =>
        b.id === brandId ? { ...b, status: 'INACTIVE' } : b
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate brand');
      console.error('Error deactivating brand:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading brands...
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
          <h1 className="text-4xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant brands</p>
        </div>
        <button
          onClick={() => navigate('/admin/brands/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          + Create Brand
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No brands yet</h3>
          <p className="text-gray-600 mb-6">Create your first brand to get started</p>
          <button
            onClick={() => navigate('/admin/brands/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Create Brand
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6"
            >
              {/* Brand Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{brand.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{brand.id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    brand.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {brand.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {brand.outlet_count || 0}
                  </div>
                  <div className="text-xs text-gray-600">Outlets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {brand.user_count || 0}
                  </div>
                  <div className="text-xs text-gray-600">Users</div>
                </div>
              </div>

              {/* Created Date */}
              <div className="mt-4 text-xs text-gray-500">
                Created: {new Date(brand.created_at).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => navigate(`/admin/outlets?brand=${brand.id}`)}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-medium"
                >
                  View Outlets
                </button>
                {brand.status === 'ACTIVE' && (
                  <button
                    onClick={() => setDeleteConfirm(brand.id)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-medium"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Deactivate Brand?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate this brand? This action cannot be easily undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const brand = brands.find(b => b.id === deleteConfirm);
                  handleDeactivate(deleteConfirm, brand?.name);
                }}
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