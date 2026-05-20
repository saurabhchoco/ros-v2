import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { getTenantContext } from '../../utils/tenantContext';   // ADD THIS

export default function MenuManagement() {
  const [searchParams] = useSearchParams();
  const outletIdParam = searchParams.get('outlet');
  const outlet = useAuthStore((s) => s.outlet);

  const orgIdParam = searchParams.get('org'); // for Super Admin override

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Get tenant IDs from the logged-in user's outlet
  const { organizationId: userOrgId, outletId: userOutletId } = getTenantContext(outlet);
  // Use URL param if provided (brand owner viewing specific outlet), else user's own outlet
  const organizationId = userOrgId || orgIdParam;
  console.log('organizationId:', organizationId, 'userOrgId:', userOrgId, 'orgIdParam:', orgIdParam);
  const targetOutletId = outletIdParam || userOutletId;

  // Load categories when organization and target outlet are known
  useEffect(() => {
    if (!organizationId || !targetOutletId) {
      console.log('Missing organizationId or targetOutletId');
      setLoading(false);
      return;
    }

    const loadCategories = async () => {
      try {
        const res = await apiService.getCategories(organizationId, targetOutletId);
        const cats = res.data.data || [];
        setCategories(cats);
        if (cats.length > 0) {
          setActiveCategory(cats[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [organizationId, targetOutletId]);  // Correct dependencies

  // Load items when active category changes
  useEffect(() => {
    if (!activeCategory || !organizationId || !targetOutletId) return;

    const loadItems = async () => {
      try {
        const res = await apiService.getMenuItems(organizationId, targetOutletId, activeCategory);
        setItems(res.data.data || []);
      } catch (err) {
        console.error('Failed to load items', err);
      }
    };

    loadItems();
  }, [activeCategory, organizationId, targetOutletId]);  // No 'outlet' dependency

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!organizationId || !targetOutletId) {
      alert('Organization or Outlet ID missing. Cannot upload.');
      return;
    }

    setUploading(true);
    try {
      await adminApi.uploadMenuCSV(file, organizationId, targetOutletId);
      alert('Menu uploaded successfully');
      window.location.reload(); // Reload to show new menu
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Menu Management</h2>

      {/* CSV Upload */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <label className="block">
          <p className="text-sm font-semibold text-gray-700 mb-3">Upload Menu CSV</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </label>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              activeCategory === cat.id
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            <span className="text-xs mb-1 block">{item.is_veg ? '🟢' : '🔴'}</span>
            <p className="font-semibold text-gray-800 text-sm leading-tight mb-2">{item.name}</p>
            <p className="text-indigo-500 font-bold">₹{Number(item.base_price || 0)}</p>
            <button className="w-full mt-3 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
              Edit
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center text-gray-400 py-8">No items in this category</div>
      )}
    </div>
  );
}