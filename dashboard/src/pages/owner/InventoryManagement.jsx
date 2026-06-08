import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { getTenantContext } from '../../utils/tenantContext';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function InventoryManagement() {
  const outlet = useAuthStore((s) => s.outlet);
  const { organizationId } = getTenantContext(outlet);

  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [ingredientForm, setIngredientForm] = useState({
    ingredient_code: '', name: '', category_id: '', base_unit_id: '', default_cost_per_base_unit: ''
  });

  useEffect(() => {
    if (!organizationId) return;
    const fetchData = async () => {
      try {
        const [catRes, ingRes, unitRes] = await Promise.all([
          apiService.getInventoryCategories(),
          apiService.getIngredients(),
          apiService.getInventoryUnits()
        ]);
        setCategories(catRes.data.data || []);
        setIngredients(ingRes.data.data || []);
        setUnits(unitRes.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [organizationId]);

  const filteredIngredients = useMemo(() => {
    let list = ingredients;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(term) || i.ingredient_code.toLowerCase().includes(term));
    }
    if (activeCategory) {
      list = list.filter(i => i.category_id === activeCategory);
    }
    return list;
  }, [ingredients, searchTerm, activeCategory]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await apiService.createInventoryCategory(newCategoryName);
      toast.success('Category created');
      const res = await apiService.getInventoryCategories();
      setCategories(res.data.data);
      setShowCategoryModal(false);
      setNewCategoryName('');
    } catch (err) {
      toast.error('Failed to create category');
    }
  };

  const handleCreateIngredient = async () => {
    if (!ingredientForm.name || !ingredientForm.ingredient_code) return;
    try {
      await apiService.createIngredient(ingredientForm);
      toast.success('Ingredient created');
      const res = await apiService.getIngredients();
      setIngredients(res.data.data);
      setShowIngredientModal(false);
      setIngredientForm({ ingredient_code: '', name: '', category_id: '', base_unit_id: '', default_cost_per_base_unit: '' });
    } catch (err) {
      toast.error('Failed to create ingredient');
    }
  };

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-6" />Loading inventory...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <button
          onClick={() => setShowIngredientModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          + Add Ingredient
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar – categories */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border p-3">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold">Categories</div>
            <button onClick={() => setShowCategoryModal(true)} className="text-xs text-indigo-600">+ New</button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!activeCategory ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
            >
              All Ingredients
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between ${activeCategory === cat.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
              >
                <span>{cat.name}</span>
                <span className="text-gray-400 text-xs">
                  {ingredients.filter(i => i.category_id === cat.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Center – ingredients list */}
        <div className="flex-1">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2">Code</th>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Category</th>
                  <th className="text-left px-4 py-2">Base Unit</th>
                  <th className="text-right px-4 py-2">Default Cost</th>
                  <th className="text-center px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map(ing => (
                  <tr key={ing.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm">{ing.ingredient_code}</td>
                    <td className="px-4 py-2">{ing.name}</td>
                    <td className="px-4 py-2">{ing.category_name || '-'}</td>
                    <td className="px-4 py-2">{ing.base_unit_symbol}</td>
                    <td className="px-4 py-2 text-right">₹{Number(ing.default_cost_per_base_unit).toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${ing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {ing.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar – health (placeholder) */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border p-3">
          <div className="font-semibold mb-2">Inventory Health</div>
          <div className="text-2xl font-bold text-indigo-600">{ingredients.length}</div>
          <div className="text-sm text-gray-500">Total Ingredients</div>
          <div className="mt-4 text-xs text-gray-400">Stock levels & low stock alerts will appear here in Sprint 2.</div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">New Category</h3>
            <input type="text" placeholder="Category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full border rounded px-3 py-2 mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleCreateCategory} className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Modal (simplified) */}
      {showIngredientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Ingredient</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Ingredient Code (e.g., TOMATO)" value={ingredientForm.ingredient_code} onChange={e => setIngredientForm({ ...ingredientForm, ingredient_code: e.target.value })} className="w-full border rounded px-3 py-2" />
              <input type="text" placeholder="Name" value={ingredientForm.name} onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })} className="w-full border rounded px-3 py-2" />
              <select value={ingredientForm.category_id} onChange={e => setIngredientForm({ ...ingredientForm, category_id: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <select value={ingredientForm.base_unit_id} onChange={e => setIngredientForm({ ...ingredientForm, base_unit_id: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select base unit</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Default cost per base unit" value={ingredientForm.default_cost_per_base_unit} onChange={e => setIngredientForm({ ...ingredientForm, default_cost_per_base_unit: e.target.value })} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowIngredientModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleCreateIngredient} className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}