import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';

export default function Captain() {
  const outlet = useAuthStore((s) => s.outlet);

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [tableNumber, setTableNumber] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [orderSource, setOrderSource] = useState('DINE_IN');

useEffect(() => {
  // Extract both camelCase and snake_case variations
  const orgId = outlet?.organizationId || outlet?.organization_id;
  const outletId = outlet?.outletId || outlet?.outlet_id || outlet?.id;

  console.log('Captain - outlet:', outlet);
  console.log('Captain - orgId:', orgId);
  console.log('Captain - outletId:', outletId);

  if (!orgId || !outletId) {
    console.log('Missing org or outlet ID');
    setLoading(false);
    return;
  }

  const load = async () => {
    try {
      console.log('Fetching categories for org:', orgId, 'outlet:', outletId);
      const res = await apiService.getCategories(orgId, outletId);
      const cats = res.data.data || [];
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0].id);
    } catch (e) {
      console.error('Failed to load categories', e);
    } finally {
      setLoading(false);
    }
  };

  load();
}, [outlet]);

useEffect(() => {
  const orgId = outlet?.organizationId || outlet?.organization_id;
  const outletId = outlet?.outletId || outlet?.outlet_id || outlet?.id;

  if (!activeCategory || !orgId || !outletId) return;

  const load = async () => {
    try {
      console.log('Fetching items for category:', activeCategory);
      const res = await apiService.getMenuItems(
        orgId,
        outletId,
        activeCategory
      );
      setItems(res.data.data || []);
    } catch (e) {
      console.error('Failed to load items', e);
    }
  };

  load();
}, [activeCategory, outlet]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing?.quantity === 1) {
        return prev.filter(c => c.id !== itemId);
      }
      return prev.map(c =>
        c.id === itemId
          ? { ...c, quantity: c.quantity - 1 }
          : c
      );
    });
  };

  const getQty = (itemId) =>
    cart.find(c => c.id === itemId)?.quantity || 0;

  const cartTotal = cart.reduce(
    (s, i) => s + parseFloat(i.base_price) * i.quantity, 0
  );
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const res = await apiService.createOrder({
        organizationId: outlet.organizationId,
        outletId: outlet.outletId,
        orderSource,
        tableNumber: tableNumber || undefined,
        tokenNumber: tokenNumber || undefined,
        customerName: customerName || undefined,
        customerMobile: customerMobile || undefined,
        items: cart.map(i => ({
          itemName: i.name,
          quantity: i.quantity,
          unitPrice: parseFloat(i.base_price),
        })),
      });
      setOrderSuccess(res.data.data);
      setCart([]);
      setTableNumber('');
      setTokenNumber('');
      setCustomerName('');
      setCustomerMobile('');
    } catch (e) {
      alert('Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (!outlet) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        No outlet assigned
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading menu...
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Order Placed!
          </h2>
          <p className="text-indigo-500 font-bold text-xl mb-4">
            {orderSuccess.order_no}
          </p>
          {orderSuccess.table_number && (
            <p className="text-gray-500 mb-1">
              🪑 Table {orderSuccess.table_number}
            </p>
          )}
          {orderSuccess.token_number && (
            <p className="text-gray-500 mb-1">
              🎫 Token {orderSuccess.token_number}
            </p>
          )}
          {orderSuccess.customer_name && (
            <p className="text-gray-500 mb-1">
              👤 {orderSuccess.customer_name}
            </p>
          )}
          <p className="text-3xl font-extrabold text-gray-900 my-5">
            ₹{parseFloat(orderSuccess.grand_total).toFixed(2)}
          </p>
          <button
            onClick={() => setOrderSuccess(null)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:opacity-90 transition"
          >
            + New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left — Menu */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 border-r border-gray-200">

        {/* Category Tabs */}
        <div className="flex gap-2 px-5 py-4 overflow-x-auto bg-white border-b border-gray-200 flex-shrink-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5 overflow-y-auto flex-1">
          {items.map(item => {
            const qty = getQty(item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow"
              >
                <span className="text-xs mb-1">
                  {item.is_veg ? '🟢' : '🔴'}
                </span>
                <p className="font-semibold text-gray-800 text-sm leading-tight flex-1">
                  {item.name}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-indigo-500 font-bold">
                    ₹{parseFloat(item.base_price).toFixed(0)}
                  </span>
                  {qty > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-full border-2 border-indigo-400 text-indigo-500 flex items-center justify-center font-bold text-sm hover:bg-indigo-50"
                      >
                        −
                      </button>
                      <span className="font-bold text-gray-800 text-sm w-4 text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-6 h-6 rounded-full border-2 border-indigo-400 text-indigo-500 flex items-center justify-center font-bold text-sm hover:bg-indigo-50"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition"
                    >
                      ADD
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-16">
              No items in this category
            </div>
          )}
        </div>
      </div>

      {/* Right — Cart */}
      <div className="w-80 bg-white flex flex-col shadow-xl">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Order</h3>
          <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {cartCount} items
          </span>
        </div>

        {/* Order type */}
        <div className="px-4 py-3 border-b border-gray-100">
          <select
            value={orderSource}
            onChange={e => setOrderSource(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
          >
            <option value="DINE_IN">Dine In</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </div>

        {/* Details */}
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          {[
            { val: tableNumber, set: setTableNumber, placeholder: 'Table No.' },
            { val: tokenNumber, set: setTokenNumber, placeholder: 'Token No.' },
            { val: customerName, set: setCustomerName, placeholder: 'Customer Name' },
            { val: customerMobile, set: setCustomerMobile, placeholder: 'Phone (WhatsApp)' },
          ].map(({ val, set, placeholder }) => (
            <input
              key={placeholder}
              type="text"
              placeholder={placeholder}
              value={val}
              onChange={e => set(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            />
          ))}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <p className="text-center text-gray-300 py-8 text-sm">
              Add items from the menu
            </p>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-gray-50"
              >
                <p className="text-sm text-gray-700 flex-1 pr-2 leading-tight">
                  {item.name}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-5 h-5 rounded-full border border-indigo-400 text-indigo-500 flex items-center justify-center text-xs font-bold"
                  >
                    −
                  </button>
                  <span className="text-xs font-bold w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-5 h-5 rounded-full border border-indigo-400 text-indigo-500 flex items-center justify-center text-xs font-bold"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-gray-700 w-10 text-right">
                    ₹{(parseFloat(item.base_price) * item.quantity).toFixed(0)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-extrabold text-gray-900 text-lg">
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {placing ? 'Placing...' : `Place Order — ₹${cartTotal.toFixed(0)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}