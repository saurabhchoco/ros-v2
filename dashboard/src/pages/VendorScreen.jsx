import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../config/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { apiService } from '../services/api';
import { useSoundAlert } from '../hooks/useSoundAlert';
import Skeleton from '../components/ui/Skeleton';

export default function VendorScreen() {
  const { outletId } = useParams();
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState([]);
  const [outlet, setOutlet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useSoundAlert(orders);

  // Auto-login using stored Firebase token (not PIN)
  useEffect(() => {
    const savedToken = localStorage.getItem(`vendor_token_${outletId}`);
    if (savedToken) {
      signInWithCustomToken(auth, savedToken)
        .then(() => {
          setAuthenticated(true);
          setFirebaseReady(true);
          // Optionally fetch outlet details from token or backend
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem(`vendor_token_${outletId}`);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [outletId]);

  const handleLogin = async (inputPin = pin) => {
    if (!inputPin) {
      alert('Please enter PIN');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.vendorAuth(outletId, inputPin);
      if (res.data.success) {
        // Store only the Firebase custom token, not the PIN
        localStorage.setItem(`vendor_token_${outletId}`, res.data.firebaseToken);
        await signInWithCustomToken(auth, res.data.firebaseToken);
        setAuthenticated(true);
        setOutlet(res.data.outlet);
        setFirebaseReady(true);
      } else {
        alert('Invalid PIN');
      }
    } catch (err) {
      console.error('Auth error:', err);
      alert('Authentication failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setPin('');
      setLoading(false);
    }
  };

  // Firestore real‑time listener for active orders
  useEffect(() => {
    if (!firebaseReady || !authenticated) return;
    
    const q = query(
      collection(db, 'active_orders'), 
      where('outletId', '==', outletId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        status: doc.data().status || 'NEW'
      }));
      setOrders(ordersData);
    }, (error) => {
      console.error('Firestore error:', error);
    });
    
    return () => unsubscribe();
  }, [firebaseReady, authenticated, outletId]);

  const markReady = async (orderId) => {
    try {
      await updateDoc(doc(db, 'active_orders', orderId), { 
        status: 'READY',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to mark ready:', err);
      alert('Failed to update order status');
    }
  };

if (loading) {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl p-4 mb-4">
          <Skeleton className="h-6 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <div className="bg-white rounded-xl p-4">
          <Skeleton className="h-6 w-32 mb-3" />
          {[1,2,3].map(i => (
            <div key={i} className="border-b pb-3 mb-3">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">🔐 Vendor Login</h2>
          <input 
            type="password" 
            placeholder="Enter 4-digit PIN" 
            value={pin} 
            onChange={e => setPin(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg mb-4 text-center text-xl"
            maxLength="6"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button 
            onClick={() => handleLogin()} 
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const newOrders = orders.filter(o => o.status === 'NEW');
  const readyOrders = orders.filter(o => o.status === 'READY');

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-xl font-bold text-center">{outlet?.name || 'Vendor Screen'}</h2>
          <p className="text-center text-gray-500 text-sm">
            {newOrders.length} pending · {readyOrders.length} ready
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-bold text-lg mb-3 text-orange-600">🆕 New Orders ({newOrders.length})</h3>
          {newOrders.length === 0 && (
            <p className="text-gray-400 text-center py-4">No new orders</p>
          )}
          {newOrders.map(order => (
            <div key={order.id} className="border-b last:border-0 pb-3 mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-lg">Token #{order.token || order.id.slice(-5)}</span>
                  <div className="text-sm text-gray-600 mt-1">{order.items || 'Items'}</div>
                  <div className="font-bold mt-1">₹{order.grandTotal || 0}</div>
                </div>
                <button
                  onClick={() => markReady(order.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  ✅ Ready
                </button>
              </div>
            </div>
          ))}
        </div>

        {readyOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-lg mb-3 text-green-600">✅ Ready ({readyOrders.length})</h3>
            {readyOrders.map(order => (
              <div key={order.id} className="border-b last:border-0 pb-2 mb-2 opacity-60">
                <div className="flex justify-between">
                  <span className="font-medium">Token #{order.token || order.id.slice(-5)}</span>
                  <span className="text-sm text-green-600">Ready</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}