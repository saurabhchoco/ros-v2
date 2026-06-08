import { create } from 'zustand';
import { inventoryApi } from '../services/inventoryApi';

export const useInventoryStore = create((set, get) => ({
  // Lists
  units: [],
  vendors: [],
  categories: [],
  masterItems: [],
  itemCategories: [], // mapping list

  // Loading states
  loadingUnits: false,
  loadingVendors: false,
  loadingCategories: false,
  loadingMasterItems: false,
  loadingItemCategories: false,

  // Fetch functions
  fetchUnits: async () => {
    set({ loadingUnits: true });
    try {
      const res = await inventoryApi.getUnits();
      set({ units: res.data.data });
    } finally {
      set({ loadingUnits: false });
    }
  },

  fetchVendors: async () => {
    set({ loadingVendors: true });
    try {
      const res = await inventoryApi.getVendors();
      set({ vendors: res.data.data });
    } finally {
      set({ loadingVendors: false });
    }
  },

  fetchCategories: async (outletId) => {
    set({ loadingCategories: true });
    try {
      const res = await inventoryApi.getCategories(outletId);
      set({ categories: res.data.data });
    } finally {
      set({ loadingCategories: false });
    }
  },

  fetchMasterItems: async () => {
    set({ loadingMasterItems: true });
    try {
      const res = await inventoryApi.getMasterItems();
      set({ masterItems: res.data.data });
    } finally {
      set({ loadingMasterItems: false });
    }
  },

  fetchItemCategories: async (outletId) => {
    set({ loadingItemCategories: true });
    try {
      const res = await inventoryApi.getItemCategories(outletId);
      set({ itemCategories: res.data.data });
    } finally {
      set({ loadingItemCategories: false });
    }
  },

  // Helper to refresh all masters (used after create/update/delete)
  refreshAllMasters: async () => {
    await Promise.all([
      get().fetchUnits(),
      get().fetchVendors(),
      get().fetchMasterItems()
      // categories depend on outletId, not refreshed here
    ]);
  },

  // Item‑category specific actions
  assignItemCategory: async (data, outletId) => {
    await inventoryApi.assignItemCategory(data);
    await get().fetchItemCategories(outletId);
  },

  removeItemCategory: async (mappingId, outletId) => {
    await inventoryApi.removeItemCategory(mappingId);
    await get().fetchItemCategories(outletId);
  }
}));