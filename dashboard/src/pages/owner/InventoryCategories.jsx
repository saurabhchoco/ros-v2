import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { inventoryApi } from '../../services/inventoryApi';
import InventorySidebar from '../../components/inventory/InventorySidebar';
import InventorySummary from '../../components/inventory/InventorySummary';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export default function InventoryCategories() {
  const outlet = useAuthStore((s) => s.outlet);
  const outletId = outlet?.id || (outlet?.outletId ?? null);
  const { categories, fetchCategories } = useInventoryStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    displayOrder: 0
  });

  useEffect(() => {
    if (outletId) fetchCategories(outletId);
  }, [outletId]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        outletId,
        name: form.name.trim(),
        description: form.description || undefined,
        displayOrder: form.displayOrder
      };
      if (selected) {
        await inventoryApi.updateCategory(selected.id, payload);
        toast.success('Category updated');
      } else {
        await inventoryApi.createCategory(payload);
        toast.success('Category created');
      }
      await fetchCategories(outletId);
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelected(null);
    setForm({ name: '', description: '', displayOrder: 0 });
  };

  const handleEdit = (cat) => {
    setSelected(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      displayOrder: cat.display_order ?? 0
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await inventoryApi.deleteCategory(deleteTarget.id);
      toast.success('Category deleted');
      await fetchCategories(outletId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
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
          <h1 className="text-2xl font-bold">Categories</h1>
          <Button onClick={() => { resetForm(); setOpen(true); }}>Add Category</Button>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Display Order</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b">
                  <td className="p-4">{cat.name}</td>
                  <td className="p-4">{cat.description || '-'}</td>
                  <td className="p-4">{cat.display_order ?? 0}</td>
                  <td className="p-4">
                    <button onClick={() => handleEdit(cat)} className="text-indigo-600 mr-2">Edit</button>
                    <button onClick={() => setDeleteTarget(cat)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan="4" className="p-6 text-center text-gray-400">No categories found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selected ? 'Edit Category' : 'Add Category'}</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded p-2" />
              <textarea placeholder="Description" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded p-2" />
              <input type="number" placeholder="Display Order" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} className="w-full border rounded p-2" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center gap-2">
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        danger
        loading={loading}
      />
    </div>
  );
}