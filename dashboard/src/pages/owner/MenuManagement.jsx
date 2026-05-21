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

  const [editingItem, setEditingItem] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboForm, setComboForm] = useState({ name: '', basePrice: '', categoryId: '', components: [] });
  const [availableItems, setAvailableItems] = useState([]); // for combo builder

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

  const EditItemModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: item.name,
    basePrice: item.base_price,
    description: item.description || '',
    isVeg: item.is_veg,
    taxPercentage: item.tax_percentage,
    isAvailable: item.is_available
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    await onSave(item.id, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Edit Item</h3>
        <div className="space-y-3">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full border p-2 rounded" />
          <input name="basePrice" type="number" value={form.basePrice} onChange={handleChange} placeholder="Price" className="w-full border p-2 rounded" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={handleChange} /> Veg
          </label>
          <input name="taxPercentage" type="number" value={form.taxPercentage} onChange={handleChange} placeholder="Tax %" className="w-full border p-2 rounded" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} /> Available (In Stock)
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
};

const ComboModal = ({ onClose, onSave, availableItems, outletId, categoryId }) => {
  const [form, setForm] = useState({ name: '', basePrice: '', selectedItems: [] });
  const [components, setComponents] = useState([]);

  const addComponent = (itemId) => {
    setComponents(prev => [...prev, { itemId, quantity: 1, discountPercent: 0 }]);
  };

  const removeComponent = (index) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    await onSave({
      name: form.name,
      basePrice: parseFloat(form.basePrice),
      categoryId,
      components: components.map(c => ({ itemId: c.itemId, quantity: c.quantity, discountPercent: c.discountPercent }))
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">Create Combo</h3>
        <input type="text" placeholder="Combo Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded mb-2" />
        <input type="number" placeholder="Combo Price" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} className="w-full border p-2 rounded mb-2" />
        <div className="mb-2">
          <label className="block font-medium">Select Items</label>
          <select multiple className="w-full border p-2 rounded h-32" onChange={(e) => addComponent(e.target.value)}>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>{item.name} (₹{item.base_price})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Components</label>
          {components.map((comp, idx) => (
            <div key={idx} className="flex justify-between items-center border-b py-1">
              <span>{availableItems.find(i => i.id === comp.itemId)?.name}</span>
              <input type="number" value={comp.quantity} onChange={e => setComponents(prev => prev.map((c, i) => i === idx ? { ...c, quantity: parseInt(e.target.value) } : c))} className="w-16 border p-1 rounded" />
              <button onClick={() => removeComponent(idx)} className="text-red-500">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded">Create Combo</button>
        </div>
      </div>
    </div>
  );
};

const saveItemEdit = async (id, updates) => {
  try {
    await apiService.updateMenuItem(id, updates);
    // Refresh items
    const res = await apiService.getMenuItems(organizationId, targetOutletId, activeCategory);
    setItems(res.data.data || []);
  } catch (err) {
    alert('Failed to update item');
  }
};

const deleteItem = async (id) => {
  try {
    await apiService.deleteMenuItem(id);
    // Refresh items
    const res = await apiService.getMenuItems(organizationId, targetOutletId, activeCategory);
    setItems(res.data.data || []);
  } catch (err) {
    alert('Failed to delete item');
  }
};

const createCombo = async (comboData) => {
  try {
    await adminApi.createCombo({ ...comboData, organizationId, outletId: targetOutletId });
    // Refresh items
    const res = await apiService.getMenuItems(organizationId, targetOutletId, activeCategory);
    setItems(res.data.data || []);
  } catch (err) {
    alert('Failed to create combo');
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

      {/* Create Combo Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowComboModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          + Create Combo
        </button>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 p-5">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-4 relative">
            {!item.is_available && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Out of Stock</div>
            )}
            <div className="flex justify-between items-start">
              <span className={`text-lg ${item.is_veg ? 'text-green-600' : 'text-red-600'}`}>
                {item.is_veg ? '🟢' : '🔴'}
              </span>
              {item.item_type === 'COMBO' && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">🔥 Combo</span>}
            </div>
            <h3 className="font-bold text-gray-800 mt-2">{item.name}</h3>
            {item.description && <p className="text-xs text-gray-400 mt-1">{item.description}</p>}
            <div className="flex justify-between items-center mt-3">
              <span className="text-indigo-600 font-bold text-xl">₹{Number(item.base_price).toFixed(0)}</span>
              <div className="flex gap-2">
                <button onClick={() => setEditingItem(item)} className="text-indigo-500 text-sm hover:underline">✏️</button>
                <button onClick={() => { if (confirm('Delete item?')) deleteItem(item.id); }} className="text-red-500 text-sm hover:underline">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center text-gray-400 py-8">No items in this category</div>
      )}
      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={saveItemEdit}
        />
      )}

      {/* Create Combo Modal */}
      {showComboModal && (
        <ComboModal
          onClose={() => setShowComboModal(false)}
          onSave={createCombo}
          availableItems={items.filter(i => i.item_type !== 'COMBO')}
          outletId={targetOutletId}
          categoryId={activeCategory}
        />
      )}
    </div>
  );
}