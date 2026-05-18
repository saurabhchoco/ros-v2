import { create } from 'zustand';

export const useOrderStore = create((set) => ({
  orders: [],
  loading: false,
  filter: 'ALL',

  setOrders: (orders) => set({ orders }),
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o =>
      o.id === orderId ? { ...o, orderStatus: status } : o
    )
  })),
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders]
  })),
  removeOrder: (orderId) => set((state) => ({
    orders: state.orders.filter(o => o.id !== orderId)
  })),
  setLoading: (loading) => set({ loading }),
  setFilter: (filter) => set({ filter }),
}));
