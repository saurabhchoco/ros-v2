import { useEffect, useState } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import { inventoryApi } from '../../services/inventoryApi';
import InventorySidebar from '../../components/inventory/InventorySidebar';
import InventorySummary from '../../components/inventory/InventorySummary';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export default function InventoryMasterItems() {
  const { masterItems, units, vendors, fetchMasterItems, fetchUnits, fetchVendors } = useInventoryStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    itemCode: '',
    name: '',
    description: '',
    itemType: 'RAW_MATERIAL',
    primaryUnitId: '',
    defaultVendorId: ''
  });

  useEffect(() => {
    fetchMasterItems();
    fetchUnits();
    fetchVendors();
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!form.primaryUnitId) {
      toast.error('Please select a unit');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.itemCode) delete payload.itemCode; // auto-generate if empty
      if (selected) {
        await inventoryApi.updateMasterItem(selected.id, payload);
        toast.success('Item updated');
      } else {
        await inventoryApi.createMasterItem(payload);
        toast.success('Item created');
      }
      await fetchMasterItems();
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
    setForm({
      itemCode: '',
      name: '',
      description: '',
      itemType: 'RAW_MATERIAL',
      primaryUnitId: '',
      defaultVendorId: ''
    });
  };

  const handleEdit = (item) => {
    setSelected(item);
    setForm({
      itemCode: item.item_code || '',
      name: item.name,
      description: item.description || '',
      itemType: item.item_type,
      primaryUnitId: item.primary_unit_id,
      defaultVendorId: item.default_vendor_id || ''
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await inventoryApi.deleteMasterItem(deleteTarget.id);
      toast.success('Item deleted');
      await fetchMasterItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  const itemTypeOptions = [
    { value: 'RAW_MATERIAL', label: 'Raw Material' },
    { value: 'PACKAGING', label: 'Packaging' },
    { value: 'CONSUMABLE', label: 'Consumable' },
    { value: 'FINISHED_GOOD', label: 'Finished Good' }
  ];

  return (
    <div className="flex gap-6">
      <InventorySidebar />
      <div className="flex-1 space-y-6">
        <InventorySummary />
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Master Items</h1>
          <Button onClick={() => { resetForm(); setOpen(true); }}>Add Item</Button>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Code</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Unit</th>
                <th className="text-left p-4">Default Vendor</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {masterItems.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-4 font-mono text-sm">{item.item_code || '-'}</td>
                  <td className="p-4">{item.name}</td>
                  <td className="p-4">{item.item_type?.replace('_', ' ')}</td>
                  <td className="p-4">{item.unit_name || item.primary_unit_id} </td>
                  <td className="p-4">{item.vendor_name || '-'} </td>
                  <td className="p-4">
                    <button onClick={() => handleEdit(item)} className="text-indigo-600 mr-2">Edit</button>
                    <button onClick={() => setDeleteTarget(item)} className="text-red-600">Delete</button>
                   </td>
                 </tr>
              ))}
              {masterItems.length === 0 && (
                <tr><td colSpan="6" className="p-6 text-center text-gray-400">No items found</td></tr>
              )}
            </tbody>
           </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selected ? 'Edit Item' : 'Add Item'}</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Item Code (optional, auto-generated if empty)" value={form.itemCode} onChange={e => setForm({ ...form, itemCode: e.target.value })} className="w-full border rounded p-2" />
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded p-2" />
              <textarea placeholder="Description" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded p-2" />
              <select value={form.itemType} onChange={e => setForm({ ...form, itemType: e.target.value })} className="w-full border rounded p-2">
                {itemTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select value={form.primaryUnitId} onChange={e => setForm({ ...form, primaryUnitId: e.target.value })} className="w-full border rounded p-2">
                <option value="">Select Base Unit *</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </select>
              <select value={form.defaultVendorId} onChange={e => setForm({ ...form, defaultVendorId: e.target.value })} className="w-full border rounded p-2">
                <option value="">Select Default Vendor (optional)</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
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
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        danger
        loading={loading}
      />
    </div>
  );
}