import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useInventoryStore } from '../../store/inventoryStore';
import InventorySidebar from '../../components/inventory/InventorySidebar';
import InventorySummary from '../../components/inventory/InventorySummary';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export default function InventoryItemCategoryMapping() {
  const outlet = useAuthStore((s) => s.outlet);
  const outletId = outlet?.id || (outlet?.outletId ?? null);
  const {
    itemCategories,
    masterItems,
    categories,
    fetchItemCategories,
    fetchMasterItems,
    fetchCategories,
    assignItemCategory,
    removeItemCategory
  } = useInventoryStore();

  const [open, setOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (outletId) {
      fetchItemCategories(outletId);
      fetchMasterItems();
      fetchCategories(outletId);
    }
  }, [outletId]);

  const handleAssign = async () => {
    if (!selectedItemId || !selectedCategoryId) {
      toast.error('Select both an item and a category');
      return;
    }
    setLoading(true);
    try {
      await assignItemCategory({
        outletId,
        masterItemId: selectedItemId,
        categoryId: selectedCategoryId
      }, outletId);
      toast.success('Item assigned to category');
      setOpen(false);
      setSelectedItemId('');
      setSelectedCategoryId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await removeItemCategory(deleteTarget.id, outletId);
      toast.success('Mapping removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Removal failed');
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  if (!outletId) return <div className="p-6">No outlet selected</div>;

  return (
    <div className="flex gap-6">
      <InventorySidebar />
      <div className="flex-1 space-y-6">
        <InventorySummary />
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Item Category Mapping</h1>
          <Button onClick={() => setOpen(true)}>Assign Item to Category</Button>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Item Name</th>
                <th className="text-left p-4">Category Name</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {itemCategories.map(mapping => (
                <tr key={mapping.id} className="border-b">
                  <td className="p-4">{mapping.item_name} (ID: {mapping.master_item_id})</td>
                  <td className="p-4">{mapping.category_name}</td>
                  <td className="p-4">
                    <button
                      onClick={() => setDeleteTarget(mapping)}
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {itemCategories.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-400">
                    No mappings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Assign Item to Category</h2>
            <div className="space-y-3">
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">Select Master Item</option>
                {masterItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.item_code})</option>
                ))}
              </select>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleAssign} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center gap-2">
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleRemove}
        title="Remove Mapping"
        message={`Are you sure you want to remove the mapping for "${deleteTarget?.item_name}" from category "${deleteTarget?.category_name}"?`}
        confirmText="Remove"
        danger
        loading={loading}
      />
    </div>
  );
}