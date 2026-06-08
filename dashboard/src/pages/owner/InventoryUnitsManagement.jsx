import { useEffect, useState } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import { inventoryApi } from '../../services/inventoryApi';
import InventorySidebar from '../../components/inventory/InventorySidebar';
import InventorySummary from '../../components/inventory/InventorySummary';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export default function InventoryUnitsManagement() {
  const { units, fetchUnits } = useInventoryStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    unitType: 'COUNT',
    isBaseUnit: false
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.symbol.trim()) {
      toast.error('Name and symbol are required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        unitType: form.unitType,
        isBaseUnit: form.isBaseUnit
      };
      if (selected) {
        await inventoryApi.updateUnit(selected.id, payload);
        toast.success('Unit updated');
      } else {
        await inventoryApi.createUnit(payload);
        toast.success('Unit created');
      }
      await fetchUnits();
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
      if (err.response?.status === 400 && msg.includes('already exists')) {
        // Duplicate – user already sees the error
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelected(null);
    setForm({ name: '', symbol: '', unitType: 'COUNT', isBaseUnit: false });
  };

  const handleEdit = (unit) => {
    setSelected(unit);
    setForm({
      name: unit.name,
      symbol: unit.symbol,
      unitType: unit.unit_type,
      isBaseUnit: unit.is_base_unit
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await inventoryApi.deleteUnit(deleteTarget.id);
      toast.success('Unit deleted');
      await fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex gap-6">
      <InventorySidebar />
      <div className="flex-1 space-y-6">
        <InventorySummary />
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Units</h1>
          <Button onClick={() => { resetForm(); setOpen(true); }}>Add Unit</Button>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Symbol</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Base Unit</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map(unit => (
                <tr key={unit.id} className="border-b">
                  <td className="p-4">{unit.name}</td>
                  <td className="p-4">{unit.symbol}</td>
                  <td className="p-4">{unit.unit_type}</td>
                  <td className="p-4">{unit.is_base_unit ? 'Yes' : 'No'}</td>
                  <td className="p-4">
                    <button onClick={() => handleEdit(unit)} className="text-indigo-600 mr-2">Edit</button>
                    <button onClick={() => setDeleteTarget(unit)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr><td colSpan="5" className="p-6 text-center text-gray-400">No units found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selected ? 'Edit Unit' : 'Add Unit'}</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded p-2" />
              <input type="text" placeholder="Symbol *" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} className="w-full border rounded p-2" />
              <select value={form.unitType} onChange={e => setForm({ ...form, unitType: e.target.value })} className="w-full border rounded p-2">
                <option value="WEIGHT">Weight</option>
                <option value="VOLUME">Volume</option>
                <option value="COUNT">Count</option>
              </select>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isBaseUnit} onChange={e => setForm({ ...form, isBaseUnit: e.target.checked })} />
                Base Unit
              </label>
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
        title="Delete Unit"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        danger
        loading={loading}
      />
    </div>
  );
}