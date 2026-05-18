import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDiF_fake_key_123456789",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ros-v2-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ros-v2-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ros-v2-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const kdsService = {
  // Listen to active orders for an outlet
  subscribeToActiveOrders(organizationId, outletId, callback) {
    const q = query(
      collection(db, 'active_orders'),
      where('organizationId', '==', organizationId),
      where('outletId', '==', outletId)
    );

    return onSnapshot(q, (snapshot) => {
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(orders);
    });
  },

  // Listen to archived orders
  subscribeToArchivedOrders(organizationId, outletId, callback) {
    const q = query(
      collection(db, 'archived_orders'),
      where('organizationId', '==', organizationId),
      where('outletId', '==', outletId)
    );

    return onSnapshot(q, (snapshot) => {
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(orders);
    });
  }
};