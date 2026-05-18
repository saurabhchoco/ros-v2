import { create } from 'zustand';

export const useOutletStore = create((set) => ({
  currentOutlet: null,
  outlets: [],

  setCurrentOutlet: (outlet) => set({ currentOutlet: outlet }),
  setOutlets: (outlets) => set({ outlets }),
  switchOutlet: (outletId) => set((state) => ({
    currentOutlet: state.outlets.find(o => o.id === outletId)
  })),
}));
