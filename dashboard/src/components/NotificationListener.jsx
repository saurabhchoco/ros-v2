import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function NotificationListener() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;

    // Reference to the user_notifications collection
    const notificationsRef = collection(db, 'user_notifications');
    const q = query(notificationsRef, where('userId', '==', user.uid), where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.type === 'SHIFT_RECEIVED') {
            toast(
              (t) => (
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">📦 Shift Received</p>
                  <p className="text-sm">
                    {data.fromUserName} transferred {data.transferredOrdersCount} orders
                  </p>
                  <p className="text-xs text-gray-500">
                    Open: {data.openOrders} | Ready: {data.readyOrders}
                  </p>
                  <button
                    onClick={() => {
                      navigate('/orders');
                      toast.dismiss(t.id);
                    }}
                    className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Review Orders
                  </button>
                </div>
              ),
              { duration: 10000 }
            );
            // Mark as read
            updateDoc(doc(db, 'user_notifications', change.doc.id), { read: true }).catch(console.error);
          }
        }
      });
    }, (error) => {
      console.error('Notification listener error:', error);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  return null;
}