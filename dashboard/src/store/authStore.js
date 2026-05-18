import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  outlet: null,
  permissions: [],
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setOutlet: (outlet) => set({ outlet }),
  setPermissions: (perms) => set({ permissions: perms }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  logout: () => set({
    user: null,
    outlet: null,
    permissions: [],
    isLoading: false,
    error: null,
  }),
}));
