import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  notifications: [],
  modals: {},

  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),

  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification]
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  openModal: (modalName, data) => set((state) => ({
    modals: { ...state.modals, [modalName]: data }
  })),

  closeModal: (modalName) => set((state) => {
    const newModals = { ...state.modals };
    delete newModals[modalName];
    return { modals: newModals };
  }),
}));
