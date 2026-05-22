import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

export default function PublicOrder() {
  const { outletId } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', mobile: '' });
  const [paymentProof, setPaymentProof] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Get outlet info to fetch organizationId
        const outletRes = await apiService.getPublicOutlet(outletId);
        const orgId = outletRes.data.data.organization_id;
        setOrganizationId(orgId);
        
        // Fetch categories using public endpoint
        const categoriesRes = await apiService.getPublicCategories(orgId, outletId);
        const cats = categoriesRes.data.data || [];
        
        if (cats.length > 0) {
          // Fetch items for first category using public endpoint
          const itemsRes = await apiService.getPublicMenuItems(orgId, outletId, cats[0].id);
          setMenu({ categories: cats, items: itemsRes.data.data || [] });
        } else {
          setMenu({ categories: [], items: [] });
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [outletId]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (!existing) return prev;
      if (existing.qty === 1) {
        return prev.filter(i => i.id !== itemId);
      }
      return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const total = cart.reduce((sum, i) => sum + Number(i.base_price) * i.qty, 0);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }
    
    const orderData = {
      outletId,
      organizationId,
      items: cart.map(i => ({ 
        itemName: i.name, 
        quantity: i.qty, 
        unitPrice: Number(i.base_price) 
      })),
      customerName: customer.name || undefined,
      customerMobile: customer.mobile || undefined,
      paymentProof: paymentProof ? await toBase64(paymentProof) : undefined
    };
    
    try {
      const res = await apiService.createPublicOrder(orderData);
      setOrderPlaced(res.data.data);
      setCart([]);
      setCustomer({ name: '', mobile: '' });
      setPaymentProof(null);
    } catch (err) {
      console.error('Order failed:', err);
      alert('Order failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading menu...</div>;
  }

  if (orderPlaced) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-green-600">✅ Order Placed!</h2>
        <p className="text-lg mt-2">Token: <strong>{orderPlaced.token}</strong></p>
        <p>Estimated wait: {orderPlaced.waitMinutes} minutes</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded"
        >
          New Order
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🍽️ Menu</h1>
      
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
        {menu.categories.map(cat => (
          <button 
            key={cat.id} 
            className="px-3 py-1 bg-gray-100 rounded-full whitespace-nowrap text-sm"
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      {/* Menu Items */}
      <div className="space-y-2 mb-6">
        {menu.items.map(item => {
          const cartItem = cart.find(i => i.id === item.id);
          return (
            <div key={item.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">₹{Number(item.base_price).toFixed(0)}</p>
              </div>
              <div className="flex items-center gap-2">
                {cartItem?.qty > 0 && (
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="w-7 h-7 bg-red-500 text-white rounded-full font-bold"
                  >
                    -
                  </button>
                )}
                <span className="w-6 text-center font-medium">{cartItem?.qty || 0}</span>
                <button 
                  onClick={() => addToCart(item)} 
                  className="w-7 h-7 bg-green-500 text-white rounded-full font-bold"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Order Summary */}
      {cart.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between font-bold mb-3">
            <span>Total</span>
            <span>₹{total.toFixed(0)}</span>
          </div>
          
          <input 
            type="text" 
            placeholder="Your Name (optional)" 
            className="w-full border p-2 rounded mb-2" 
            value={customer.name} 
            onChange={e => setCustomer({...customer, name: e.target.value})} 
          />
          
          <input 
            type="tel" 
            placeholder="Mobile (optional)" 
            className="w-full border p-2 rounded mb-2" 
            value={customer.mobile} 
            onChange={e => setCustomer({...customer, mobile: e.target.value})} 
          />
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan UPI QR & Upload Screenshot
            </label>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={e => setPaymentProof(e.target.files[0])} 
              className="w-full text-sm"
            />
          </div>
          
          <button 
            onClick={handlePlaceOrder} 
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-lg"
          >
            Place Order
          </button>
        </div>
      )}
      
      {cart.length === 0 && menu.items.length > 0 && (
        <div className="text-center text-gray-400 py-8">
          Add items from the menu above
        </div>
      )}
      
      {menu.items.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No items available
        </div>
      )}
    </div>
  );
}