import { useEffect, useState } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import { inventoryApi } from '../../services/inventoryApi';
import InventorySidebar from '../../components/inventory/InventorySidebar';
import InventorySummary from '../../components/inventory/InventorySummary';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export default function InventoryVendors() {
  const { vendors, fetchVendors } = useInventoryStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    setLoading(true);
    try {
      if (selected) {
        await inventoryApi.updateVendor(selected.id, form);
        toast.success('Vendor updated');
      } else {
        await inventoryApi.createVendor(form);
        toast.success('Vendor created');
      }
      await fetchVendors();
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
      name: '', contactPerson: '', phone: '', email: '', gstNumber: '', address: ''
    });
  };

  const handleEdit = (vendor) => {
    setSelected(vendor);
    setForm({
      name: vendor.name || '',
      contactPerson: vendor.contact_person || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      gstNumber: vendor.gst_number || '',
      address: vendor.address || ''
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await inventoryApi.deleteVendor(deleteTarget.id);
      toast.success('Vendor deleted');
      await fetchVendors();
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
          <h1 className="text-2xl font-bold">Vendors</h1>
          <Button onClick={() => { resetForm(); setOpen(true); }}>Add Vendor</Button>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Contact</th>
                <th className="text-left p-4">Phone</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">GST</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} className="border-b">
                  <td className="p-4">{v.name}</td>
                  <td className="p-4">{v.contact_person || '-'}</td>
                  <td className="p-4">{v.phone || '-'}</td>
                  <td className="p-4">{v.email || '-'}</td>
                  <td className="p-4">{v.gst_number || '-'}</td>
                  <td className="p-4">
                    <button onClick={() => handleEdit(v)} className="text-indigo-600 mr-2">Edit</button>
                    <button onClick={() => setDeleteTarget(v)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr><td colSpan="6" className="p-6 text-center text-gray-400">No vendors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selected ? 'Edit Vendor' : 'Add Vendor'}</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded p-2" />
              <input type="text" placeholder="Contact Person" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="w-full border rounded p-2" />
              <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded p-2" />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded p-2" />
              <input type="text" placeholder="GST Number" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} className="w-full border rounded p-2" />
              <textarea placeholder="Address" rows="2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full border rounded p-2" />
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
        title="Delete Vendor"
        message={`Are you sure you want to delete ${deleteTarget?.name}?`}
        confirmText="Delete"
        danger
        loading={loading}
      />
    </div>
  );
}