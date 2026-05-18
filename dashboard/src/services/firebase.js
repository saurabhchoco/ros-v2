import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

import { db } from '../config/firebase';

export const kdsService = {

  subscribeToActiveOrders(
    organizationId,
    outletId,
    callback
  ) {
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

  subscribeToArchivedOrders(
    organizationId,
    outletId,
    callback
  ) {
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