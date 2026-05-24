import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { Plus, Edit3, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTenantContext } from '../utils/tenantContext';

export default function InventoryList() {
  const outlet = useAuthStore((s) => s.outlet);
  const { organizationId, outletId } = getTenantContext(outlet);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [form, setForm] = useState({ name: '', currentStock: 0, lowStockThreshold: 0, baseUnit: 'g' });

  useEffect(() => {
    fetchInventory();
  }, []);

const fetchInventory = async () => {
  setLoading(true);
  try {
    const res = await apiService.getInventory();
    setItems(res.data.data);
  } catch (err) {
    toast.error('Failed to load inventory');
  } finally {
    setLoading(false);
  }
};

const handleCreate = async () => {
  const currentStock = parseFloat(form.currentStock) || 0;
  const lowStockThreshold = parseFloat(form.lowStockThreshold) || 0;
  if (!form.name.trim()) {
    toast.error('Name is required');
    return;
  }
  try {
    await apiService.createInventoryItem({
      name: form.name,
      currentStock,
      lowStockThreshold,
      baseUnit: form.baseUnit,
      organizationId,
      outletId
    });
    toast.success('Item created');
    setShowModal(false);
    setForm({ name: '', currentStock: 0, lowStockThreshold: 0, baseUnit: 'g' });
    fetchInventory();
  } catch (err) {
    toast.error('Creation failed: ' + (err.response?.data?.message || err.message));
  }
};

  const handleAdjust = async (id, change, reason) => {
    try {
      await apiService.adjustInventoryStock(id, change, reason);
      toast.success('Stock updated');
      setAdjustingItem(null);
      fetchInventory();
    } catch (err) {
      toast.error('Adjustment failed');
    }
  };

  if (loading) return <div className="p-6"><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <Button onClick={() => setShowModal(true)} icon={Plus}>Add Ingredient</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Current Stock</th>
              <th className="text-left p-3">Low Threshold</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">{item.current_stock} {item.base_unit}</td>
                <td className="p-3">{item.low_stock_threshold} {item.base_unit}</td>
                <td className="p-3">
                  {item.current_stock < item.low_stock_threshold ? (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                      <AlertCircle className="w-3 h-3" /> Low Stock
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">OK</span>
                  )}
                </td>
                <td className="p-3">
                  <button onClick={() => setAdjustingItem(item)} className="text-indigo-500 mr-2">Adjust</button>
                  <button onClick={() => setEditingItem(item)} className="text-gray-500">Edit</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-400">No inventory items yet. Add one.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Ingredient</h2>
            <input className="w-full border p-2 rounded mb-2" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input
                className="w-full border p-2 rounded mb-2"
                type="number"
                step="any"
                placeholder="Current Stock"
                value={form.currentStock}
                onChange={e => setForm({...form, currentStock: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
            />
            <input
                className="w-full border p-2 rounded mb-2"
                type="number"
                step="any"
                placeholder="Low Stock Threshold"
                value={form.lowStockThreshold}
                onChange={e => setForm({...form, lowStockThreshold: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
            />
            <select className="w-full border p-2 rounded mb-4" value={form.baseUnit} onChange={e => setForm({...form, baseUnit: e.target.value})}>
              <option value="g">grams (g)</option>
              <option value="ml">millilitres (ml)</option>
              <option value="pcs">pieces (pcs)</option>
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Adjust Stock: {adjustingItem.name}</h2>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={() => handleAdjust(adjustingItem.id, 1, 'MANUAL_ADJUSTMENT')}>+1</Button>
              <Button variant="outline" onClick={() => handleAdjust(adjustingItem.id, 5, 'MANUAL_ADJUSTMENT')}>+5</Button>
              <Button variant="outline" onClick={() => handleAdjust(adjustingItem.id, -1, 'WASTE')}>-1</Button>
              <Button variant="outline" onClick={() => handleAdjust(adjustingItem.id, -5, 'WASTE')}>-5</Button>
            </div>
            <input className="w-full border p-2 rounded mb-2" type="number" placeholder="Custom amount (+/-)" id="customAmount" />
            <select className="w-full border p-2 rounded mb-4" id="customReason">
              <option value="MANUAL_ADJUSTMENT">Manual Correction</option>
              <option value="WASTE">Waste / Spillage</option>
              <option value="PURCHASE">Purchase</option>
            </select>
            <button className="w-full bg-indigo-500 text-white py-2 rounded" onClick={() => {
              const amount = parseFloat(document.getElementById('customAmount').value);
              const reason = document.getElementById('customReason').value;
              if (isNaN(amount)) return;
              handleAdjust(adjustingItem.id, amount, reason);
            }}>Apply Custom</button>
            <button className="w-full mt-2 text-gray-500" onClick={() => setAdjustingItem(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}