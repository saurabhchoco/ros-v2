// dashboard/src/store/menuStore.js
import { create } from 'zustand';

const useMenuStore = create((set, get) => ({
  categories: [],
  itemsByCategory: {},
  allItems: [],          // flat list for global search
  loadingCategories: false,
  loadingItems: {},
  loadingAllItems: false,

  fetchCategories: async (orgId, outletId, apiService) => {
    if (get().categories.length > 0) return;
    set({ loadingCategories: true });
    try {
      const res = await apiService.getCategories(orgId, outletId);
      set({ categories: res.data.data || [] });
    } finally {
      set({ loadingCategories: false });
    }
  },

  fetchItems: async (orgId, outletId, categoryId, apiService) => {
    if (get().itemsByCategory[categoryId]) return;
    set({ loadingItems: { ...get().loadingItems, [categoryId]: true } });
    try {
      const res = await apiService.getMenuItems(orgId, outletId, categoryId);
      set({ itemsByCategory: { ...get().itemsByCategory, [categoryId]: res.data.data || [] } });
    } finally {
      set({ loadingItems: { ...get().loadingItems, [categoryId]: false } });
    }
  },

  fetchAllItems: async (orgId, outletId, apiService) => {
    if (get().allItems.length > 0) return;
    set({ loadingAllItems: true });
    try {
      // Ensure categories are loaded first
      let cats = get().categories;
      if (cats.length === 0) {
        const catRes = await apiService.getCategories(orgId, outletId);
        cats = catRes.data.data || [];
        set({ categories: cats });
      }
      // Fetch items for each category in parallel
      const itemPromises = cats.map(cat => apiService.getMenuItems(orgId, outletId, cat.id));
      const itemResponses = await Promise.all(itemPromises);
      const allItemsFlat = itemResponses.flatMap(res => res.data.data || []);
      set({ allItems: allItemsFlat });
      // Also populate itemsByCategory (optional but useful for per‑category browsing)
      const newItemsByCategory = {};
      cats.forEach((cat, idx) => {
        newItemsByCategory[cat.id] = itemResponses[idx].data.data || [];
      });
      set({ itemsByCategory: newItemsByCategory });
    } catch (err) {
      console.error('Failed to fetch all items', err);
    } finally {
      set({ loadingAllItems: false });
    }
  },
}));

export default useMenuStore;