import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { adminApi } from '../../services/adminApi';


export default function MenuManagement() {
  const [searchParams] = useSearchParams();
  const outletId = searchParams.get('outlet');
  const outlet = useAuthStore((s) => s.outlet);

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // const orgId = outlet?.organizationId || outlet?.organization_id;
  const orgId = outlet?.organizationId || outlet?.organization_id || outlet?.organizationId;


  useEffect(() => {

    console.log('Outlet:', outlet);
    console.log('Org ID extracted:', orgId);

      if (!outletId || !orgId) {
        console.log('Missing outlet or org ID');
        return;
      }

    const load = async () => {
      try {
      const catRes = await apiService.getCategories(
        orgId,  // USE orgId, not outlet.organization_id
        outletId
      );
      // try {
      //   const catRes =
      //     await apiService.getCategories(
      //       outlet.orgId,
      //       outletId
      //     );
        const cats = catRes.data.data || [];
        setCategories(cats);
        if (cats.length > 0) {
          setActiveCategory(cats[0].id);
        }
      } catch (e) {
        console.error('Failed to load categories', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [outletId, orgId, outlet]);

  useEffect(() => {
    if (!activeCategory || !outlet || !outletId)
      return;

    const load = async () => {
      try {
        const res =
          await apiService.getMenuItems(
            outlet.orgId,
            outletId,
            activeCategory
          );
        setItems(res.data.data || []);
      } catch (e) {
        console.error('Failed to load items', e);
      }
    };
    load();
  }, [activeCategory, outlet, outletId]);

const handleCSVUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file || !outlet) return;

  // FIX: Extract orgId properly
  const orgId = outlet?.organizationId || outlet?.organization_id;
  
  if (!orgId) {
    alert('Organization ID not found');
    return;
  }

  setUploading(true);
  try {
    await adminApi.uploadMenuCSV(
      file,
      orgId,  // USE THE EXTRACTED orgId
      outletId
    );
    alert('Menu uploaded successfully');
    window.location.reload();
  } catch (err) {
    alert('Upload failed: ' + err.message);
  } finally {
    setUploading(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">
          Loading menu...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Menu Management
      </h2>

      {/* CSV Upload */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <label className="block">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Upload Menu CSV
          </p>
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
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
          >
            <span className="text-xs mb-1 block">
              {item.is_veg ? '🟢' : '🔴'}
            </span>
            <p className="font-semibold text-gray-800 text-sm leading-tight mb-2">
              {item.name}
            </p>
            <p className="text-indigo-500 font-bold">
              ₹{parseFloat(item.base_price).toFixed(0)}
            </p>
            <button
              className="w-full mt-3 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No items in this category
        </div>
      )}
    </div>
  );
}