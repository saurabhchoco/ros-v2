// dashboard/src/pages/owner/MenuManagement.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { getTenantContext } from '../../utils/tenantContext';
import Skeleton from '../../components/ui/Skeleton';
import MenuImportExportModal from '../../components/MenuImportExportModal';
import toast from 'react-hot-toast';
import MenuHealth from '../../components/MenuHealth';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { createPortal } from 'react-dom';

// ========== Custom hook for dropdowns with portal and scroll container ==========
const useDropdown = (scrollContainerRef) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 128;
    const height = 160;
    let top = rect.bottom + window.scrollY + 4;
    let left = rect.left + window.scrollX;
    if (rect.bottom + height > window.innerHeight) {
      top = rect.top + window.scrollY - height - 4;
    }
    if (left + width > window.innerWidth + window.scrollX) {
      left = window.innerWidth + window.scrollX - width - 4;
    }
    if (left < 0) left = 4;
    setPosition({ top, left });
  };

  const open = () => {
    updatePosition();
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);
  const toggle = () => (isOpen ? close() : open());

  // Close when the scrollable container scrolls (if provided) or window
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => close();
    const scrollElement = scrollContainerRef?.current || window;
    scrollElement.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen, scrollContainerRef]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return { isOpen, toggle, close, position, buttonRef, dropdownRef };
};

// ========== Helper: Simple CSV export ==========
const toCSV = (rows, columns) => {
  const headers = columns.join(',');
  const csvRows = rows.map(row =>
    columns.map(col => {
      let value = row[col];
      if (value === undefined || value === null) value = '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [headers, ...csvRows].join('\n');
};

// ========== Global Loading Overlay ==========
const LoadingOverlay = ({ message }) => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3 shadow-xl">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="text-sm text-gray-700">{message || 'Processing...'}</p>
    </div>
  </div>
);

// ========== Batch Action Bar (sticky footer) ==========
const BatchActionBar = ({ selectedCount, onClear, onPriceUpdate, onStatusChange, onCategoryMove, onDeleteSelected, onExport, disabled }) => {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 flex flex-wrap items-center justify-between gap-3 z-30">
      <div className="text-sm font-medium text-gray-700">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button onClick={onPriceUpdate} disabled={disabled} className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Change Price</button>
        <button onClick={onStatusChange} disabled={disabled} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50">Change Status</button>
        <button onClick={onCategoryMove} disabled={disabled} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50">Move Category</button>
        <button onClick={onDeleteSelected} disabled={disabled} className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:opacity-50">Delete Selected</button>
        <button onClick={onExport} disabled={disabled} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50">Export Selected</button>
      </div>
      <button onClick={onClear} disabled={disabled} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50">Clear</button>
    </div>
  );
};

// ========== Row Action Menu (kebab) ==========
const RowActionMenu = ({ item, onEdit, onDuplicate, onDelete, disabled, scrollContainerRef }) => {
  const { isOpen, toggle, close, position, buttonRef, dropdownRef } = useDropdown(scrollContainerRef);

  if (disabled) return <div className="w-6 h-6"></div>;

  const handleAction = (action) => {
    action();
    close();
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
        title="Actions"
      >
        ⋮
      </button>
      {isOpen && createPortal(
        <div ref={dropdownRef} className="fixed bg-white border rounded-md shadow-lg z-50 w-32" style={{ top: position.top, left: position.left }}>
          <button
            onClick={() => handleAction(() => onEdit(item))}
            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => handleAction(() => onDuplicate(item.id))}
            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
          >
            📋 Duplicate
          </button>
          <button
            onClick={() => handleAction(() => onDelete(item.id))}
            className="block w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            🗑️ Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

// ========== Status Badge (clickable dropdown) ==========
const StatusBadge = ({ status, onStatusChange, disabled, scrollContainerRef }) => {
  const { isOpen, toggle, close, position, buttonRef, dropdownRef } = useDropdown(scrollContainerRef);
  const config = {
    active: { label: 'Active', class: 'bg-green-100 text-green-800' },
    draft: { label: 'Draft', class: 'bg-gray-100 text-gray-800' },
    out_of_stock: { label: 'Out of stock', class: 'bg-red-100 text-red-800' },
    hidden: { label: 'Hidden', class: 'bg-yellow-100 text-yellow-800' },
  };
  const current = config[status] || config.draft;

  const handleChange = (newStatus) => {
    onStatusChange(newStatus);
    close();
  };

  if (disabled) return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${current.class} opacity-50`}>{current.label}</span>;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${current.class}`}
      >
        {current.label}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && createPortal(
        <div ref={dropdownRef} className="fixed bg-white border rounded-md shadow-lg z-50 w-32" style={{ top: position.top, left: position.left }}>
          {Object.entries(config).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => handleChange(key)}
              className={`block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 ${key === status ? 'bg-indigo-50 font-medium' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

// ========== Edit Item Modal ==========
const EditItemModal = ({ item, onClose, onSave, saving }) => {
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
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Edit Item</h3>
        <div className="space-y-3">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full border p-2 rounded" disabled={saving} />
          <input name="basePrice" type="number" value={form.basePrice} onChange={handleChange} placeholder="Price" className="w-full border p-2 rounded" disabled={saving} />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" disabled={saving} />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={handleChange} disabled={saving} /> Veg
          </label>
          <input name="taxPercentage" type="number" value={form.taxPercentage} onChange={handleChange} placeholder="Tax %" className="w-full border p-2 rounded" disabled={saving} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-indigo-500 text-white rounded flex items-center gap-2">
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== Create Combo Modal (Redesigned) ==========
const ComboModal = ({ onClose, onSave, availableItems, categoryId, saving }) => {
  const [name, setName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [components, setComponents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);

  const filteredItems = availableItems.filter(item =>
    !components.some(c => c.itemId === item.id) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category_name && item.category_name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const addComponent = (item) => {
    setComponents(prev => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        price: parseFloat(item.base_price),
        quantity: 1,
        discountPercent: 0
      }
    ]);
  };

  const updateQuantity = (index, delta) => {
    setComponents(prev => prev.map((c, i) =>
      i === index ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c
    ));
  };

  const removeComponent = (index) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
  };

  const updateDiscount = (index, discount) => {
    setComponents(prev => prev.map((c, i) =>
      i === index ? { ...c, discountPercent: Math.min(100, Math.max(0, Number(discount) || 0)) } : c
    ));
  };

  const calculatedTotal = components.reduce((sum, comp) => {
    const itemPrice = comp.price * comp.quantity;
    const discount = itemPrice * (comp.discountPercent / 100);
    return sum + (itemPrice - discount);
  }, 0);

  const finalPrice = useCustomPrice && customPrice ? parseFloat(customPrice) : calculatedTotal;

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a combo name');
      return;
    }
    if (components.length < 2) {
      toast.error('Add at least 2 items to the combo');
      return;
    }
    await onSave({
      name: name.trim(),
      basePrice: finalPrice,
      categoryId,
      components: components.map(c => ({
        itemId: c.itemId,
        quantity: c.quantity,
        discountPercent: c.discountPercent
      }))
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Create Combo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 border-r p-4 flex flex-col">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                disabled={saving}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No items available</div>
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">₹{Number(item.base_price).toFixed(0)}</div>
                    </div>
                    <button
                      onClick={() => addComponent(item)}
                      disabled={saving}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm hover:bg-indigo-200"
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="w-full md:w-1/2 p-4 flex flex-col">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Combo name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                disabled={saving}
              />
            </div>
            <div className="flex-1 overflow-y-auto mb-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Components</div>
              {components.length === 0 ? (
                <div className="text-center text-gray-400 py-8 border-2 border-dashed rounded-lg">
                  Add items from the left panel
                </div>
              ) : (
                <div className="space-y-3">
                  {components.map((comp, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{comp.name}</div>
                          <div className="text-xs text-gray-500">₹{comp.price} each</div>
                        </div>
                        <button onClick={() => removeComponent(idx)} className="text-red-500 text-sm" disabled={saving}>Remove</button>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300" disabled={saving}>-</button>
                          <span className="w-8 text-center">{comp.quantity}</span>
                          <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300" disabled={saving}>+</button>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Discount (%)</label>
                          <input type="number" value={comp.discountPercent} onChange={(e) => updateDiscount(idx, e.target.value)} className="w-20 border rounded px-2 py-1 text-sm" disabled={saving} />
                        </div>
                        <div className="text-sm font-semibold">
                          ₹{(comp.price * comp.quantity * (1 - comp.discountPercent / 100)).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={useCustomPrice} onChange={(e) => setUseCustomPrice(e.target.checked)} disabled={saving} />
                  Set custom combo price
                </label>
              </div>
              {useCustomPrice ? (
                <input type="number" placeholder="Combo price" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" disabled={saving} />
              ) : (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Calculated total:</span>
                  <span className="font-bold text-lg">₹{calculatedTotal.toFixed(0)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || components.length < 2 || !name.trim()} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
            {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            Create Combo
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== Main Component ==========
export default function MenuManagement() {
  const [searchParams] = useSearchParams();
  const outletIdParam = searchParams.get('outlet');
  const outlet = useAuthStore((s) => s.outlet);
  const orgIdParam = searchParams.get('org');

  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState('');
  const [rowLoading, setRowLoading] = useState(null);
  const [successFlash, setSuccessFlash] = useState(null);

  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [showBatchPriceModal, setShowBatchPriceModal] = useState(false);
  const [batchPriceType, setBatchPriceType] = useState('percent');
  const [batchPriceValue, setBatchPriceValue] = useState(0);
  const [showBatchStatusModal, setShowBatchStatusModal] = useState(false);
  const [batchStatusValue, setBatchStatusValue] = useState('active');
  const [showBatchCategoryModal, setShowBatchCategoryModal] = useState(false);
  const [batchCategoryId, setBatchCategoryId] = useState('');
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  const { organizationId: userOrgId, outletId: userOutletId } = getTenantContext(outlet);
  const organizationId = userOrgId || orgIdParam;
  const targetOutletId = outletIdParam || userOutletId;

  const [editingItem, setEditingItem] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '', basePrice: '', description: '', categoryId: '', isVeg: true, taxPercentage: 5, isAvailable: true
  });
  const [savingModal, setSavingModal] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Ref for the scrollable container (the center list)
  const scrollContainerRef = useRef(null);

  const [showCopyMenuModal, setShowCopyMenuModal] = useState(false);
  const [selectedTargetOutletId, setSelectedTargetOutletId] = useState('');
  const [outlets, setOutlets] = useState([]); // fetch outlets for the organization

  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [selectedCategoryForActions, setSelectedCategoryForActions] = useState(null);
  const [renamingLoading, setRenamingLoading] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [mergingLoading, setMergingLoading] = useState(false);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingCategory, setRenamingCategory] = useState(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [moveToCategoryId, setMoveToCategoryId] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSource, setMergeSource] = useState(null);
  const [mergeTarget, setMergeTarget] = useState('');

  // Load categories & items (same as before)
  useEffect(() => {
    if (!organizationId || !targetOutletId) {
      setLoading(false);
      return;
    }
    const loadCategories = async () => {
      try {
        const res = await apiService.getCategories(organizationId, targetOutletId, true);
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
        toast.error('Failed to load categories');
      }
    };
    loadCategories();
  }, [organizationId, targetOutletId]);

  useEffect(() => {
    if (!organizationId || !targetOutletId) return;
    const loadAllItems = async () => {
      try {
        const res = await apiService.getMenuItems(organizationId, targetOutletId, 'all');
        setAllItems(res.data.data || []);
        setAvailableItems(res.data.data || []);
      } catch (err) {
        console.error('Failed to load items', err);
        toast.error('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };
    loadAllItems();
  }, [organizationId, targetOutletId]);

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const res = await apiService.getOrganizationOutlets();
        setOutlets(res.data.data || []);
      } catch (err) {
        console.error('Failed to load outlets', err);
        // Fallback: if endpoint not ready, allow manual entry? Or show message
        toast.error('Could not load outlets. Please refresh.');
      }
    };
    if (organizationId) fetchOutlets();
  }, [organizationId]);

  // Selection helpers
  const toggleSelectItem = (itemId) => {
    if (globalLoading) return;
    const newSelected = new Set(selectedItemIds);
    if (newSelected.has(itemId)) newSelected.delete(itemId);
    else newSelected.add(itemId);
    setSelectedItemIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (globalLoading) return;
    if (selectedItemIds.size === filteredAndSortedItems.length) {
      setSelectedItemIds(new Set());
    } else {
      const allIds = filteredAndSortedItems.map(item => item.id);
      setSelectedItemIds(new Set(allIds));
    }
  };

  const clearSelection = () => setSelectedItemIds(new Set());

  // Batch handlers (unchanged)

const handleRenameCategory = async () => {
  if (!newCategoryName.trim()) return;
  setRenamingLoading(true);
  try {
    await apiService.updateCategory(renamingCategory.id, newCategoryName);
    toast.success('Category renamed');
    setShowRenameModal(false);
    setRenamingCategory(null);
    setNewCategoryName('');
    await refreshCategories();
  } catch (err) {
    toast.error('Rename failed');
  } finally {
    setRenamingLoading(false);
  }
};

const handleDeleteCategory = async () => {
  if (!deletingCategory) return;
  setDeletingLoading(true);
  try {
    await apiService.deleteCategory(deletingCategory.id, moveToCategoryId || null);
    toast.success('Category deleted');
    setShowDeleteCategoryModal(false);
    setDeletingCategory(null);
    setMoveToCategoryId('');
    await refreshCategories();
    if (activeCategory === deletingCategory.id) setActiveCategory(null);
  } catch (err) {
    toast.error(err.response?.data?.error || 'Delete failed');
  } finally {
    setDeletingLoading(false);
  }
};

const handleMergeCategories = async () => {
  if (!mergeSource || !mergeTarget) return;
  setMergingLoading(true);
  try {
    await apiService.mergeCategories(mergeSource.id, mergeTarget);
    toast.success('Categories merged');
    setShowMergeModal(false);
    setMergeSource(null);
    setMergeTarget('');
    await refreshCategories();
    if (activeCategory === mergeSource.id) setActiveCategory(null);
  } catch (err) {
    toast.error('Merge failed');
  } finally {
    setMergingLoading(false);
  }
};

  const refreshCategories = async () => {
    const res = await apiService.getCategories(organizationId, targetOutletId, true);
    setCategories(res.data.data || []);
  };

  const handleBatchPriceUpdate = () => {
    if (selectedItemIds.size === 0) return;
    setShowBatchPriceModal(true);
  };
  const handleBatchStatusChange = () => {
    if (selectedItemIds.size === 0) return;
    setShowBatchStatusModal(true);
  };
  const handleBatchCategoryMove = () => {
    if (selectedItemIds.size === 0) return;
    setShowBatchCategoryModal(true);
  };
  const handleBatchDeleteSelected = () => {
    if (selectedItemIds.size === 0) return;
    setShowBatchDeleteConfirm(true);
  };
  const confirmBatchDelete = async () => {
    setGlobalLoading(true);
    setGlobalLoadingMessage(`Deleting ${selectedItemIds.size} items...`);
    try {
      for (const id of Array.from(selectedItemIds)) {
        await apiService.deleteMenuItem(id);
      }
      toast.success(`Deleted ${selectedItemIds.size} items`);
      clearSelection();
      await refreshItems();
    } catch (err) {
      toast.error('Failed to delete some items');
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage('');
      setShowBatchDeleteConfirm(false);
    }
  };
  const handleBatchExport = () => {
    if (selectedItemIds.size === 0) return;
    const selectedItems = allItems.filter(item => selectedItemIds.has(item.id));
    const csvRows = selectedItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category_name,
      base_price: item.base_price,
      description: item.description,
      is_veg: item.is_veg,
      status: item.status,
    }));
    const columns = ['id', 'name', 'category', 'base_price', 'description', 'is_veg', 'status'];
    const csv = toCSV(csvRows, columns);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_menu_items.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const submitBatchPriceUpdate = async () => {
    setGlobalLoading(true);
    setGlobalLoadingMessage(`Updating prices for ${selectedItemIds.size} items...`);
    try {
      await apiService.batchUpdateMenuItems(
        Array.from(selectedItemIds),
        { type: 'price', value: batchPriceValue, isPercent: batchPriceType === 'percent' }
      );
      toast.success(`Price updated for ${selectedItemIds.size} items`);
      clearSelection();
      await refreshItems();
    } catch (err) {
      toast.error('Batch price update failed');
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage('');
      setShowBatchPriceModal(false);
      setBatchPriceValue(0);
    }
  };

  const refreshItems = async () => {
    try {
      const res = await apiService.getMenuItems(organizationId, targetOutletId, 'all');
      setAllItems(res.data.data || []);
      setAvailableItems(res.data.data || []);
      const catRes = await apiService.getCategories(organizationId, targetOutletId, true);
      setCategories(catRes.data.data || []);
    } catch (err) {
      toast.error('Failed to refresh');
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let items = allItems;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.category_name?.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }
    if (activeCategory && activeCategory !== 'all') {
      items = items.filter(item => item.category_id === activeCategory);
    }
    if (statusFilter !== 'all') {
      items = items.filter(item => item.status === statusFilter);
    }
    switch (sortBy) {
      case 'name_asc':
        items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        items.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'price_asc':
        items.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
        break;
      case 'price_desc':
        items.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
        break;
      default: break;
    }
    return items;
  }, [allItems, searchTerm, activeCategory, statusFilter, sortBy]);

  const updateItemStatus = async (itemId, newStatus) => {
    setRowLoading(itemId);
    try {
      await apiService.updateMenuItem(itemId, { status: newStatus });
      await refreshItems();
      toast.success(`Status updated to ${newStatus}`);
      setSuccessFlash(itemId);
      setTimeout(() => setSuccessFlash(null), 1000);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setRowLoading(null);
    }
  };

  const saveItemEdit = async (id, updates) => {
    setSavingModal(true);
    try {
      await apiService.updateMenuItem(id, updates);
      await refreshItems();
      toast.success('Item updated');
      setEditingItem(null);
      setSuccessFlash(id);
      setTimeout(() => setSuccessFlash(null), 1000);
    } catch (err) {
      toast.error('Failed to update item');
    } finally {
      setSavingModal(false);
    }
  };

  const deleteItem = (id) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setRowLoading(itemToDelete);
    try {
      await apiService.deleteMenuItem(itemToDelete);
      await refreshItems();
      toast.success('Item deleted');
    } catch (err) {
      toast.error('Failed to delete item');
    } finally {
      setRowLoading(null);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleRowDuplicate = async (itemId) => {
    setRowLoading(itemId);
    try {
      await apiService.duplicateMenuItem(itemId);
      await refreshItems();
      toast.success('Item duplicated');
      setSuccessFlash(itemId);
      setTimeout(() => setSuccessFlash(null), 1000);
    } catch (err) {
      toast.error('Duplicate failed');
    } finally {
      setRowLoading(null);
    }
  };

  const createCombo = async (comboData) => {
    setSavingModal(true);
    try {
      await adminApi.createCombo({ ...comboData, organizationId, outletId: targetOutletId });
      await refreshItems();
      toast.success('Combo created');
      setShowComboModal(false);
    } catch (err) {
      toast.error('Failed to create combo');
    } finally {
      setSavingModal(false);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    setGlobalLoading(true);
    setGlobalLoadingMessage('Creating category...');
    try {
      await apiService.createCategory({ name: newCategoryName, organizationId, outletId: targetOutletId });
      toast.success('Category created');
      setNewCategoryName('');
      setShowCategoryModal(false);
      const res = await apiService.getCategories(organizationId, targetOutletId, true);
      setCategories(res.data.data || []);
    } catch (err) {
      toast.error('Failed to create category');
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage('');
    }
  };

  const createMenuItem = async () => {
    setSavingModal(true);
    try {
      await apiService.createMenuItem({
        ...newItemForm,
        organizationId,
        outletId: targetOutletId,
        basePrice: parseFloat(newItemForm.basePrice),
        categoryId: newItemForm.categoryId || (categories[0]?.id),
      });
      toast.success('Item created');
      setShowItemModal(false);
      setNewItemForm({ name: '', basePrice: '', description: '', categoryId: '', isVeg: true, taxPercentage: 5, isAvailable: true });
      await refreshItems();
    } catch (err) {
      toast.error('Failed to create item');
    } finally {
      setSavingModal(false);
    }
  };

  const handleExport = async () => {
    setGlobalLoading(true);
    setGlobalLoadingMessage('Exporting menu...');
    try {
      const response = await apiService.menuExport(targetOutletId);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menu_${targetOutletId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setGlobalLoading(false);
      setGlobalLoadingMessage('');
    }
  };

  const downloadSample = async () => {
    try {
      const response = await apiService.menuSample();
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu_sample.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download sample');
    }
  };

  const handleCopyMenu = async () => {
    if (!selectedTargetOutletId) {
      toast.error('Please select a target outlet');
      return;
    }
    // ✅ Set loading state FIRST
    setGlobalLoading(true);
    setGlobalLoadingMessage(`Copying menu to ${selectedTargetOutletId}...`);
    try {
      await apiService.copyMenuToOutlet(targetOutletId, selectedTargetOutletId);
      toast.success('Menu copied successfully');
      setShowCopyMenuModal(false);
      if (selectedTargetOutletId === targetOutletId) {
        await refreshItems();
      }
    } catch (err) {
      console.error('Copy error:', err);
      toast.error(err.response?.data?.error || 'Copy failed');
    } finally {
      // ✅ Reset loading state after completion (success or error)
      setGlobalLoading(false);
      setGlobalLoadingMessage('');
      setSelectedTargetOutletId('');
    }
  };

  if (loading) {
    return <div className="p-6"><Skeleton className="h-8 w-48 mb-6" />Loading menu...</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Global Loading Overlay */}
      {globalLoading && <LoadingOverlay message={globalLoadingMessage} />}

      {/* Fixed Header - never scrolls */}
      <div className="flex-shrink-0 p-6 pb-0">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
          <div className="relative">
            <button
              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              disabled={globalLoading}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm flex items-center gap-1 hover:bg-gray-200 disabled:opacity-50"
            >
              Menu Tools ▼
            </button>
            {showToolsDropdown && !globalLoading && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-20">
                <button onClick={() => { setShowToolsDropdown(false); setShowImportModal(true); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Import CSV</button>
                <button onClick={() => { setShowToolsDropdown(false); handleExport(); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Export CSV</button>
                <button onClick={() => { setShowToolsDropdown(false); downloadSample(); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Download Sample CSV</button>
                <button onClick={() => { setShowToolsDropdown(false); setShowCopyMenuModal(true); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Copy Menu to Outlet</button>
              </div>
            )}
          </div>
        </div>

        {/* Search + Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, category, SKU, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={globalLoading}
              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={activeCategory === null ? 'all' : activeCategory}
            onChange={(e) => setActiveCategory(e.target.value === 'all' ? null : e.target.value)}
            disabled={globalLoading}
            className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name} ({cat.item_count || 0})</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={globalLoading}
            className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="hidden">Hidden</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            disabled={globalLoading}
            className="border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
          </select>

          <div className="relative">
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              disabled={globalLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 disabled:opacity-50"
            >
              + Add <span className="text-lg">▼</span>
            </button>
            {showAddDropdown && !globalLoading && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-20">
                <button onClick={() => { setShowAddDropdown(false); setShowItemModal(true); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Menu Item</button>
                <button onClick={() => { setShowAddDropdown(false); setShowComboModal(true); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Combo</button>
                <button onClick={() => { setShowAddDropdown(false); setShowCategoryModal(true); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Category</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Three-column layout – sidebars fixed, center scrolls */}
      <div className="flex-1 min-h-0 flex flex-row gap-6 px-6 pb-20 overflow-hidden">
        {/* Left Sidebar – Categories (fixed, internal scroll if needed) */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border p-3 h-fit max-h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="font-semibold text-gray-700">Categories</div>
            <button
              onClick={() => setShowManageCategoriesModal(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Manage
            </button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveCategory(null)}
              disabled={globalLoading}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeCategory === null ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50'
                } disabled:opacity-50`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                disabled={globalLoading}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex justify-between items-center ${activeCategory === cat.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50'
                  } disabled:opacity-50`}
              >
                <span>{cat.name}</span>
                <span className="text-gray-400 text-xs">{cat.item_count ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center – Menu List (scrollable) */}
        <div ref={scrollContainerRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="bg-white rounded-xl border">
            {/* Select All toolbar – sticky */}
            <div className="px-4 py-2 border-b bg-gray-50 flex justify-between items-center sticky top-0 bg-gray-50 z-10">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedItemIds.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                  onChange={toggleSelectAll}
                  disabled={globalLoading}
                  className="rounded border-gray-300 disabled:opacity-50"
                />
                Select All
              </label>
              <span className="text-sm text-gray-500">{filteredAndSortedItems.length} items</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredAndSortedItems.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No items found</div>
              ) : (
                filteredAndSortedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition ${successFlash === item.id ? 'bg-green-100' : ''}`}
                    style={{ transition: 'background-color 0.3s ease' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          disabled={globalLoading || rowLoading === item.id}
                          className="rounded border-gray-300 disabled:opacity-50"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <span className={`inline-block w-4 h-4 rounded-full mt-0.5 ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-medium text-gray-800">{item.name}</span>
                                <span className="font-semibold text-gray-900">₹{Number(item.base_price).toFixed(0)}</span>
                                <StatusBadge
                                  status={item.status || (item.is_available ? 'active' : 'out_of_stock')}
                                  onStatusChange={(newStatus) => updateItemStatus(item.id, newStatus)}
                                  disabled={globalLoading || rowLoading === item.id}
                                  scrollContainerRef={scrollContainerRef}
                                />
                              </div>
                              {item.description && <p className="text-xs text-gray-400 mt-1">{item.description}</p>}
                              <div className="text-xs text-gray-400 mt-1">{item.category_name}</div>
                            </div>
                          </div>
                          {rowLoading === item.id ? (
                            <div className="p-1">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            </div>
                          ) : (
                            <RowActionMenu
                              item={item}
                              onEdit={setEditingItem}
                              onDuplicate={handleRowDuplicate}
                              onDelete={deleteItem}
                              disabled={globalLoading}
                              scrollContainerRef={scrollContainerRef}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar – Menu Health (fixed, no scroll) */}
        <div className="w-72 flex-shrink-0">
          <MenuHealth outletId={targetOutletId} compact={true} />
        </div>
      </div>

      {/* Batch Action Bar (sticky footer) */}
      <BatchActionBar
        selectedCount={selectedItemIds.size}
        onClear={clearSelection}
        onPriceUpdate={handleBatchPriceUpdate}
        onStatusChange={handleBatchStatusChange}
        onCategoryMove={handleBatchCategoryMove}
        onDeleteSelected={handleBatchDeleteSelected}
        onExport={handleBatchExport}
        disabled={globalLoading}
      />

      {/* Modals (unchanged) */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={saveItemEdit}
          saving={savingModal}
        />
      )}
      {showComboModal && (
        <ComboModal
          onClose={() => setShowComboModal(false)}
          onSave={createCombo}
          availableItems={availableItems}
          categoryId={activeCategory || categories[0]?.id}
          saving={savingModal}
        />
      )}
      {showImportModal && (
        <MenuImportExportModal
          outletId={targetOutletId}
          onClose={() => setShowImportModal(false)}
          onSuccess={refreshItems}
        />
      )}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">New Menu Item</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Name" value={newItemForm.name} onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })} className="w-full border p-2 rounded" disabled={savingModal} />
              <input type="number" placeholder="Price" value={newItemForm.basePrice} onChange={e => setNewItemForm({ ...newItemForm, basePrice: e.target.value })} className="w-full border p-2 rounded" disabled={savingModal} />
              <textarea placeholder="Description" value={newItemForm.description} onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })} className="w-full border p-2 rounded" disabled={savingModal} />
              <select value={newItemForm.categoryId} onChange={e => setNewItemForm({ ...newItemForm, categoryId: e.target.value })} className="w-full border p-2 rounded" disabled={savingModal}>
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <label className="flex items-center gap-2"><input type="checkbox" checked={newItemForm.isVeg} onChange={e => setNewItemForm({ ...newItemForm, isVeg: e.target.checked })} disabled={savingModal} /> Veg</label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowItemModal(false)} disabled={savingModal} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={createMenuItem} disabled={savingModal} className="px-4 py-2 bg-indigo-500 text-white rounded flex items-center gap-2">
                {savingModal && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">New Category</h3>
            <input type="text" placeholder="Category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full border p-2 rounded" disabled={globalLoading} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCategoryModal(false)} disabled={globalLoading} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={createCategory} disabled={globalLoading} className="px-4 py-2 bg-indigo-500 text-white rounded flex items-center gap-2">
                {globalLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {showBatchPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Batch Update Price</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <label className="flex items-center gap-2">
                  <input type="radio" value="percent" checked={batchPriceType === 'percent'} onChange={() => setBatchPriceType('percent')} disabled={globalLoading} /> Percentage
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="fixed" checked={batchPriceType === 'fixed'} onChange={() => setBatchPriceType('fixed')} disabled={globalLoading} /> Fixed Amount (₹)
                </label>
              </div>
              <input
                type="number"
                placeholder={batchPriceType === 'percent' ? 'e.g., 10 for +10%, -5 for -5%' : 'e.g., 20 for +₹20, -10 for -₹10'}
                value={batchPriceValue}
                onChange={(e) => setBatchPriceValue(parseFloat(e.target.value) || 0)}
                disabled={globalLoading}
                className="w-full border p-2 rounded"
              />
              <p className="text-xs text-gray-500">
                {batchPriceType === 'percent' ? 'Positive = increase, negative = decrease' : 'Positive = add to price, negative = subtract'}
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowBatchPriceModal(false)} disabled={globalLoading} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={submitBatchPriceUpdate} disabled={globalLoading} className="px-4 py-2 bg-indigo-500 text-white rounded flex items-center gap-2">
                {globalLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Apply to {selectedItemIds.size} item(s)
              </button>
            </div>
          </div>
        </div>
      )}
      {showBatchStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Change Status for {selectedItemIds.size} item(s)</h3>
            <select
              value={batchStatusValue}
              onChange={(e) => setBatchStatusValue(e.target.value)}
              disabled={globalLoading}
              className="w-full border p-2 rounded mb-4"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="hidden">Hidden</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBatchStatusModal(false)} disabled={globalLoading} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button
                onClick={async () => {
                  setGlobalLoading(true);
                  setGlobalLoadingMessage(`Updating status for ${selectedItemIds.size} items...`);
                  try {
                    await apiService.batchUpdateMenuItems(Array.from(selectedItemIds), { type: 'status', value: batchStatusValue });
                    toast.success(`Status updated for ${selectedItemIds.size} items`);
                    clearSelection();
                    await refreshItems();
                  } catch (err) {
                    toast.error('Batch status update failed');
                  } finally {
                    setGlobalLoading(false);
                    setGlobalLoadingMessage('');
                    setShowBatchStatusModal(false);
                  }
                }}
                disabled={globalLoading}
                className="px-4 py-2 bg-indigo-500 text-white rounded flex items-center gap-2"
              >
                {globalLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {showBatchCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Move {selectedItemIds.size} item(s) to Category</h3>
            <select
              value={batchCategoryId}
              onChange={(e) => setBatchCategoryId(e.target.value)}
              disabled={globalLoading}
              className="w-full border p-2 rounded mb-4"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBatchCategoryModal(false)} disabled={globalLoading} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button
                onClick={async () => {
                  if (!batchCategoryId) {
                    toast.error('Select a category');
                    return;
                  }
                  setGlobalLoading(true);
                  setGlobalLoadingMessage(`Moving ${selectedItemIds.size} items...`);
                  try {
                    await apiService.batchUpdateMenuItems(Array.from(selectedItemIds), { type: 'category', value: batchCategoryId });
                    toast.success(`Moved ${selectedItemIds.size} items`);
                    clearSelection();
                    await refreshItems();
                  } catch (err) {
                    toast.error('Batch move failed');
                  } finally {
                    setGlobalLoading(false);
                    setGlobalLoadingMessage('');
                    setShowBatchCategoryModal(false);
                    setBatchCategoryId('');
                  }
                }}
                disabled={globalLoading}
                className="px-4 py-2 bg-indigo-500 text-white rounded flex items-center gap-2"
              >
                {globalLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete {selectedItemIds.size} item(s)?</h3>
            <p className="text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBatchDeleteConfirm(false)} disabled={globalLoading} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={confirmBatchDelete} disabled={globalLoading} className="px-4 py-2 bg-red-500 text-white rounded flex items-center gap-2">
                {globalLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteItem}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        danger={true}
        loading={rowLoading === itemToDelete}
      />

      {showCopyMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Copy Menu to Another Outlet</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will replace the entire menu in the selected outlet. This action cannot be undone.
            </p>
            <select
              value={selectedTargetOutletId}
              onChange={(e) => setSelectedTargetOutletId(e.target.value)}
              disabled={globalLoading}
              className="w-full border rounded-lg px-3 py-2 mb-4 disabled:bg-gray-100"
            >
              <option value="">Select target outlet</option>
              {outlets.filter(o => o.id !== targetOutletId).map(outlet => (
                <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCopyMenuModal(false);
                  setSelectedTargetOutletId('');
                }}
                disabled={globalLoading}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyMenu}
                disabled={globalLoading || !selectedTargetOutletId}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
              >
                {globalLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {globalLoading ? 'Copying menu...' : 'Copy Menu'}
              </button>
            </div>
          </div>
        </div>
      )}

{showRenameModal && renamingCategory && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
      <h3 className="text-xl font-bold mb-4">Rename Category</h3>
      <input
        type="text"
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-4"
        autoFocus
        disabled={renamingLoading}
      />
      <div className="flex justify-end gap-2">
        <button onClick={() => setShowRenameModal(false)} disabled={renamingLoading} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        <button onClick={handleRenameCategory} disabled={renamingLoading} className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center gap-2">
          {renamingLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          Save
        </button>
      </div>
    </div>
  </div>
)}

      {showDeleteCategoryModal && deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete Category</h3>
            <p className="text-gray-600 mb-4">
              Category "{deletingCategory.name}" has {deletingCategory.item_count || 0} item(s).
            </p>
            {deletingCategory.item_count > 0 ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Move items to:</label>
                <select
                  value={moveToCategoryId}
                  onChange={(e) => setMoveToCategoryId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c.id !== deletingCategory.id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-gray-500 mb-4">This category has no items. It can be deleted safely.</p>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteCategoryModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button
                onClick={handleDeleteCategory}
                disabled={(deletingCategory.item_count > 0 && !moveToCategoryId)}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {deletingLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showMergeModal && mergeSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Merge Category</h3>
            <p className="text-gray-600 mb-2">
              Move all items from <strong>{mergeSource.name}</strong> to:
            </p>
            <select
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            >
              <option value="">Select target category</option>
              {categories.filter(c => c.id !== mergeSource.id).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-amber-600 mb-4">
              After merging, "{mergeSource.name}" will be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMergeModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button
                onClick={handleMergeCategories}
                disabled={!mergeTarget}
                className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
              >
                {mergingLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Manage Categories</h3>
              <button
                onClick={() => setShowManageCategoriesModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Split content */}
            <div className="flex-1 overflow-hidden flex flex-row">
              {/* Left panel – category list */}
              <div className="w-1/2 border-r p-4 overflow-y-auto">
                <div className="text-sm font-medium text-gray-500 mb-2">Categories</div>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryForActions(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex justify-between items-center ${selectedCategoryForActions?.id === cat.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'hover:bg-gray-50'
                        }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-gray-400 text-xs">{cat.item_count ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right panel – category details & actions */}
              <div className="w-1/2 p-4 overflow-y-auto">
                {selectedCategoryForActions ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <div className="text-gray-900">{selectedCategoryForActions.name}</div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Items</label>
                      <div className="text-gray-900">{selectedCategoryForActions.item_count ?? 0}</div>
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <button
                        onClick={() => {
                          setShowManageCategoriesModal(false);
                          setRenamingCategory(selectedCategoryForActions);
                          setNewCategoryName(selectedCategoryForActions.name);
                          setShowRenameModal(true);
                        }}
                        className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        ✏️ Rename Category
                      </button>
                      <button
                        onClick={() => {
                          setShowManageCategoriesModal(false);
                          setMergeSource(selectedCategoryForActions);
                          setMergeTarget('');
                          setShowMergeModal(true);
                        }}
                        className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                        disabled={categories.length <= 1}
                      >
                        🔀 Merge into another category
                      </button>
                      <button
                        onClick={() => {
                          setShowManageCategoriesModal(false);
                          setDeletingCategory(selectedCategoryForActions);
                          setMoveToCategoryId('');
                          setShowDeleteCategoryModal(true);
                        }}
                        className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-red-100 rounded-md text-red-600"
                      >
                        🗑️ Delete Category
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    Select a category from the left panel
                  </div>
                )}
              </div>
            </div>

            {/* Footer with “New Category” button */}
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowManageCategoriesModal(false);
                  setShowCategoryModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
              >
                + New Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}